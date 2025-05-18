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

// Map Stripe price IDs to internal plan IDs (Live Mode)
const planMap = {
  "price_1RQ3CARwXOeOt11YY4gEeYsj": "1month",
  "price_1RQ3CsRwXOeOt11YQh5Ld2Ls": "3months",
  "price_1RQ3DHRwXOeOt11YhER7lxsd": "6months",
  "price_1RQ3DaRwXOeOt11YdHNWKCc5": "1year",
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

  // Function to update subscription status in Supabase
  async function updateSubscriptionStatus(
    customerId: string,
    isSubscribed: boolean,
    plan: string | null = null,
    subscriptionId: string | null = null,
    priceId: string | null = null,
    subscriptionEnds: string | null = null,
    status: string | null = null,
    trialEnds: string | null = null
  ) {
    try {
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
    } catch (err) {
      console.error("❌ Unexpected Error:", err);
      return new Response("Server Error", { status: 500 });
    }
  }

  // Handle subscription events
  if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const status = obj.status;
    const isSubscribed = status === "active" || status === "trialing";
    const subscriptionId = obj.id;
    const priceId = obj.items?.data?.[0]?.price?.id ?? null;
    const subscriptionPlan = priceId ? planMap[priceId] || null : null;
    const subscriptionEnds = obj.current_period_end
      ? new Date(obj.current_period_end * 1000).toISOString()
      : null;
    const trialEnds = obj.trial_end
      ? new Date(obj.trial_end * 1000).toISOString()
      : null;

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

  console.log("✅ Event ignored:", event.type);
  return new Response("Ignored", { status: 200 });
});
