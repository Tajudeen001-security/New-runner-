import { createFileRoute } from "@tanstack/react-router";
import { createHmac } from "node:crypto";

function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

// One month between re-checks — cheap and means a cancelled subscription
// stops being treated as Pro within 30 days, without needing a database or
// webhook to track it in real time.
const RECHECK_INTERVAL_MS = 1000 * 60 * 60 * 24 * 30;

export const Route = createFileRoute("/api/verify-session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const signingSecret = process.env.LICENSE_SIGNING_SECRET;
        if (!secretKey || !signingSecret) {
          return textError(
            "Payments aren't configured yet. The site owner needs to set STRIPE_SECRET_KEY, STRIPE_PRICE_ID, and LICENSE_SIGNING_SECRET.",
            501,
          );
        }

        const url = new URL(request.url);
        const sessionId = url.searchParams.get("session_id");
        if (!sessionId) return textError("Missing session_id", 400);

        const stripeRes = await fetch(
          `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
          { headers: { Authorization: `Bearer ${secretKey}` } },
        );
        if (!stripeRes.ok) {
          const detail = await stripeRes.text().catch(() => "");
          return textError(`Stripe error: ${detail || stripeRes.statusText}`, stripeRes.status);
        }

        const session = await stripeRes.json();
        const paid = session.payment_status === "paid" || session.status === "complete";
        if (!paid) {
          return new Response(JSON.stringify({ pro: false }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        const exp = Date.now() + RECHECK_INTERVAL_MS;
        const payloadB64 = Buffer.from(JSON.stringify({ sid: sessionId, exp })).toString("base64url");
        const token = `${payloadB64}.${sign(payloadB64, signingSecret)}`;

        return new Response(JSON.stringify({ pro: true, token, exp }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
