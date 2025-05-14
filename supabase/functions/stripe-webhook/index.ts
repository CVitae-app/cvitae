import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import Stripe from "https://esm.sh/stripe@12.1.0";

// Supabase + Stripe setup
const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Map Stripe price IDs to internal plan IDs
const planMap = {
  "price_1RFc3fRpTB9d9YyvRz2fYeGM": "1month",
  "price_1RFcEJRpTB9d9YyvOYdhdKEn": "3months",
  "price_1RFcEhRpTB9d9Yyvv0ydhDW4": "6months",
  "price_1RFcF3RpTB9d9Yvi2ILDgHI": "1year",
};

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    const body = await req.text();
    const encoder = new TextEncoder();
    const bodyBuffer = encoder.encode(body);
    event = await stripe.webhooks.constructEventAsync(bodyBuffer, sig, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  console.log("✅ Received Stripe Event:", event.type);
  const obj = event.data.object;
  const customerId = obj.customer as string;
  console.log("✅ Stripe Customer ID:", customerId);

  async function updateSubscriptionStatus(
    customerId,
    isSubscribed,
    plan = null,
    subscriptionId = null,
    priceId = null,
    subscriptionEnds = null,
    status = null,
    trialEnds = null
  ) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile || error) {
      console.error("❌ No user found for customer ID:", customerId);
      return new Response("User not found", { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_subscribed: isSubscribed,
        subscription_plan: plan,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        subscription_ends: subscriptionEnds,
        subscription_status: status,
        trial_ends: trialEnds,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("❌ Failed to update subscription:", updateError.message);
      return new Response("Update failed", { status: 500 });
    }

    console.log("✅ Subscription Updated:", {
      userId: profile.id,
      isSubscribed,
      plan,
      subscriptionId,
      priceId,
      subscriptionEnds,
      status,
      trialEnds,
    });

    return new Response("OK", { status: 200 });
  }

  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const status = obj.status;
    const isSubscribed = status === "active" || status === "trialing";
    const subscriptionId = obj.id;
    const priceId = obj.items?.data?.[0]?.price?.id ?? null;
    const subscriptionPlan = priceId ? planMap[priceId] || null : null;
    const subscriptionEnds = obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null;
    const trialEnds = obj.trial_end ? new Date(obj.trial_end * 1000).toISOString() : null;

    return await updateSubscriptionStatus(
      customerId,
      isSubscribed,
      subscriptionPlan,
      subscriptionId,
      priceId,
      subscriptionEnds,
      status,
      trialEnds
    );
  }

  return new Response("Ignored", { status: 200 });
});
