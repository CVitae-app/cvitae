import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import Stripe from "https://esm.sh/stripe@12.1.0";

console.log("🌍 Loaded env:");
console.log("PROJECT_URL:", Deno.env.get("PROJECT_URL"));
console.log("SERVICE_ROLE_KEY length:", Deno.env.get("SERVICE_ROLE_KEY")?.length);

// Supabase Admin client
const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

// Stripe client
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

// Map Stripe price IDs to internal plan IDs
const planMap: Record<string, string> = {
  "price_1Month": "1month",
  "price_3Months": "3months",
  "price_6Months": "6months",
  "price_1Year": "1year",
};

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  let event;

  try {
    const body = await req.text();
    const encoder = new TextEncoder();
    const bodyBuffer = encoder.encode(body);

    event = await stripe.webhooks.constructEventAsync(
      bodyBuffer,
      sig!,
      endpointSecret
    );
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message);
    return new Response("Webhook Error", { status: 400 });
  }

  const obj = event.data.object;
  let customerId: string | null = null;

  // ✅ On initial checkout
  if (event.type === "checkout.session.completed") {
    customerId = obj.customer as string;
    const email = obj.customer_email ?? obj.customer_details?.email;

    if (!email || !customerId) {
      console.error("❌ Missing customer_email or customer ID in event");
      return new Response("Missing customer info", { status: 400 });
    }

    console.log("📩 Found email:", email);
    console.log("👤 Customer ID:", customerId);

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (!profile || error) {
      console.error("❌ No user found for email:", email);
      return new Response("User not found", { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        is_subscribed: true,
        stripe_customer_id: customerId,
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("❌ Failed to update profile:", updateError.message);
      return new Response("Update failed", { status: 500 });
    }

    console.log("✅ Subscribed user (checkout.session.completed):", email);
    return new Response("OK", { status: 200 });
  }

  // ✅ On subscription create/update/delete
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    customerId = obj.customer as string;
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

  // ✅ On payment success
  if (event.type === "invoice.payment_succeeded") {
    customerId = obj.customer as string;

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

  // ✅ On payment failure
  if (event.type === "invoice.payment_failed") {
    customerId = obj.customer as string;

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
