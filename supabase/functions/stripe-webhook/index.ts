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
const planMap: Record<string, string> = {
  "price_1RFc3fRpTB9d9YyvRz2fYeGM": "1month",
  "price_1RFcEJRpTB9d9YyvOYdhdKEn": "3months",
  "price_1RFcEhRpTB9d9Yyvv0ydhDW4": "6months",
  "price_1RFcF3RpTB9d9Yyvi2ILDgHI": "1year",
};

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    const body = await req.text();
    const encoder = new TextEncoder();
    const bodyBuffer = encoder.encode(body);
    event = await stripe.webhooks.constructEventAsync(bodyBuffer, sig!, endpointSecret);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  const obj = event.data.object;

  // ✅ 1. Checkout completed
  if (event.type === "checkout.session.completed") {
    const metadata = obj.metadata || {};
    const userId = metadata.user_id;
    const customerId = obj.customer;

    if (!userId || !customerId) {
      console.error("❌ Missing user_id or customer ID in metadata");
      return new Response("Missing metadata", { status: 400 });
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile || error) {
      console.error("❌ No user found for ID:", userId);
      return new Response("User not found", { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_subscribed: true,
        stripe_customer_id: customerId,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("❌ Failed to update profile:", updateError.message);
      return new Response("Update failed", { status: 500 });
    }

    console.log("✅ Subscribed user (checkout.session.completed):", userId);
    return new Response("OK", { status: 200 });
  }

  // ✅ 2. Subscription create/update/delete
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const customerId = obj.customer as string;
    const status = obj.status;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile || error) {
      console.error("❌ No user found for customer ID:", customerId);
      return new Response("User not found", { status: 404 });
    }

    const isSubscribed = status === "active" || status === "trialing";
    const subscriptionId = obj.id;
    const price = obj.items?.data?.[0]?.price;
    const priceId = price?.id ?? null;
    const interval = price?.recurring?.interval ?? null;
    const subscriptionPlan = priceId ? planMap[priceId] || null : null;

    const subscriptionEnds = obj.current_period_end
      ? new Date(obj.current_period_end * 1000).toISOString()
      : null;

    const trialEnds = obj.trial_end
      ? new Date(obj.trial_end * 1000).toISOString()
      : null;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_subscribed: isSubscribed,
        subscription_plan: subscriptionPlan,
        subscription_ends: subscriptionEnds,
        trial_ends: trialEnds,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId,
        stripe_interval: interval,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("❌ Failed to update subscription:", updateError.message);
      return new Response("Update failed", { status: 500 });
    }

    console.log("✅ Updated subscription:", {
      isSubscribed,
      subscriptionPlan,
      subscriptionEnds,
      trialEnds,
      subscriptionId,
      priceId,
      interval,
    });

    return new Response("OK", { status: 200 });
  }

  // ✅ 3. Payment succeeded
  if (event.type === "invoice.payment_succeeded") {
    const customerId = obj.customer as string;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile || error) {
      console.error("❌ No user found for invoice.customer:", customerId);
      return new Response("User not found", { status: 404 });
    }

    await supabase
      .from("profiles")
      .update({ is_subscribed: true })
      .eq("id", profile.id);

    console.log("✅ Marked user as subscribed (payment_succeeded)");
    return new Response("OK", { status: 200 });
  }

  // ✅ 4. Payment failed
  if (event.type === "invoice.payment_failed") {
    const customerId = obj.customer as string;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile || error) {
      console.error("❌ No user found for failed invoice:", customerId);
      return new Response("User not found", { status: 404 });
    }

    await supabase
      .from("profiles")
      .update({ is_subscribed: false })
      .eq("id", profile.id);

    console.log("❌ Marked user as unsubscribed (payment_failed)");
    return new Response("OK", { status: 200 });
  }

  return new Response("Ignored", { status: 200 });
});
