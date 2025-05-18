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

// Secure CORS Headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://app.cvitae.nl",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

// Enhanced Rate Limiting (Anti-DDoS)
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;
const ipRequestCounts = new Map<string, { count: number, resetAt: number }>();

function checkRateLimit(clientIp: string) {
  const now = Date.now();
  const limitData = ipRequestCounts.get(clientIp) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (now > limitData.resetAt) {
    ipRequestCounts.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (limitData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  limitData.count += 1;
  ipRequestCounts.set(clientIp, limitData);
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS_HEADERS });
  }

  const clientIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";
  if (checkRateLimit(clientIp)) {
    return new Response("Too Many Requests", { status: 429, headers: CORS_HEADERS });
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const user = await authenticateUser(token);

  if (!user) {
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
    return new Response(JSON.stringify({ error: "User profile not found." }), { status: 404, headers: CORS_HEADERS });
  }

  if (!profile.stripe_customer_id || !profile.is_subscribed) {
    return new Response(JSON.stringify({ error: "No active subscription found." }), {
      status: 403,
      headers: CORS_HEADERS,
    });
  }

  const returnUrl = "https://app.cvitae.nl/";

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  } catch (err) {
    console.error("❌ Error creating billing portal session:", err.message, { stack: err.stack, user: user.id });
    return new Response(JSON.stringify({ error: "Server Error" }), { status: 500, headers: CORS_HEADERS });
  }
});
