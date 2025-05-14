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

// ✅ Secure CORS Headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://app.cvitae.nl",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ✅ Rate Limit Configuration (Basic DDoS Protection)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5;
const ipRequestCounts = new Map<string, number>();
const ipTimestamps = new Map<string, number>();

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";

  // ✅ Basic Rate Limiting (Anti-DDoS)
  const now = Date.now();
  const requestCount = ipRequestCounts.get(clientIp) || 0;
  const lastRequestTime = ipTimestamps.get(clientIp) || 0;

  if (now - lastRequestTime < RATE_LIMIT_WINDOW_MS) {
    if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response("Too Many Requests", {
        status: 429,
        headers: CORS_HEADERS,
      });
    }
    ipRequestCounts.set(clientIp, requestCount + 1);
  } else {
    ipRequestCounts.set(clientIp, 1);
    ipTimestamps.set(clientIp, now);
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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, is_subscribed")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User profile not found." }),
        {
          status: 404,
          headers: CORS_HEADERS,
        }
      );
    }

    if (!profile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer ID found." }),
        {
          status: 400,
          headers: CORS_HEADERS,
        }
      );
    }

    if (!profile.is_subscribed) {
      return new Response(
        JSON.stringify({ error: "You must be subscribed to access the billing portal." }),
        {
          status: 403,
          headers: CORS_HEADERS,
        }
      );
    }

    // ✅ Dynamically Set Return URL Based on Environment
    const returnUrl =
      Deno.env.get("ENVIRONMENT") === "production"
        ? "https://app.cvitae.nl/"
        : "http://localhost:3000/";

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        "Content-Type": "application/json",
        ...CORS_HEADERS,
      },
    });
  } catch (err) {
    console.error("❌ Error creating billing portal session:", err);
    return new Response(
      JSON.stringify({ error: "Server Error" }),
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
});
