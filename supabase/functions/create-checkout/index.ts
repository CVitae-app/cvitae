import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.5";
import Stripe from "https://esm.sh/stripe@12.1.0";

// Supabase admin client
const supabase = createClient(
  Deno.env.get("PROJECT_URL")!,
  Deno.env.get("SERVICE_ROLE_KEY")!
);

// Stripe client
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2022-11-15",
});

// CORS setup
const allowedOrigin = "https://app.cvitae.nl";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Utility function to validate URLs
const isValidUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "app.cvitae.nl";
  } catch {
    return false;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("❌ Unauthorized:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    const body = await req.json();
    const { price_id, success_url, cancel_url } = body;

    const allowedPrices = new Set([
      "price_1RQ3CARwXOeOt11YY4gEeYsj", // 1 month
      "price_1RQ3CsRwXOeOt11YQh5Ld2Ls", // 3 months
      "price_1RQ3DHRwXOeOt11YhER7lxsd", // 6 months
      "price_1RQ3DaRwXOeOt11YdHNWKCc5", // 1 year
    ]);

    if (!allowedPrices.has(price_id)) {
      console.error("❌ Invalid price ID:", price_id);
      return new Response(JSON.stringify({ error: "Invalid price_id" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const safeSuccessUrl = isValidUrl(success_url)
      ? success_url
      : "https://app.cvitae.nl/?fromStripe=true";

    const safeCancelUrl = isValidUrl(cancel_url)
      ? cancel_url
      : "https://app.cvitae.nl/";

    // Retrieve or create Stripe customer
    let stripeCustomerId;
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError);
    }

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
      console.log("✅ Existing Stripe Customer ID:", stripeCustomerId);
    } else {
      console.log("⚡ Creating new Stripe customer...");
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
        metadata: { user_id: user.id },
      });

      stripeCustomerId = customer.id;
      console.log("✅ New Stripe Customer ID:", stripeCustomerId);

      // Save the Stripe Customer ID to profile
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);

      if (saveError) {
        console.error("❌ Error saving Stripe Customer ID to profile:", saveError);
        return new Response(JSON.stringify({ error: "Profile update failed" }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: user.id,
      success_url: safeSuccessUrl,
      cancel_url: safeCancelUrl,
      locale: "auto",
      metadata: {
        user_id: user.id,
        plan_price_id: price_id,
        created_at: new Date().toISOString(),
      },
      line_items: [
        {
          price: "price_1RQ3EERwXOeOt11YflTOv23r", // €1.95 one-time setup fee
          quantity: 1,
        },
        {
          price: price_id,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 3,
      },
    });

    console.log("✅ Stripe Checkout Session Created:", session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  }
});
