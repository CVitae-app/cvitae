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

const allowedOrigin = "https://app.cvitae.nl";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    const body = await req.json();
    const { price_id, success_url, cancel_url } = body;

    const allowedPrices = new Set([
      "price_1RFc3fRpTB9d9YyvRz2fYeGM", // 1 month
      "price_1RFcEJRpTB9d9YyvOYdhdKEn", // 3 months
      "price_1RFcEhRpTB9d9Yyvv0ydhDW4", // 6 months
      "price_1RFcF3RpTB9d9Yyvi2ILDgHI", // 1 year
    ]);

    if (!allowedPrices.has(price_id)) {
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripeCustomerId = profile?.stripe_customer_id || undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(stripeCustomerId
        ? { customer: stripeCustomerId }
        : { customer_email: user.email }),
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
          price: "price_1R7HF2RpTB9d9YyvZHV4NCQP", // €1.95 one-time setup fee
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
