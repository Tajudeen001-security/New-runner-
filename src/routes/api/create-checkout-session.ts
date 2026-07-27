import { createFileRoute } from "@tanstack/react-router";

function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

type Body = { origin?: unknown };

export const Route = createFileRoute("/api/create-checkout-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const priceId = process.env.STRIPE_PRICE_ID;
        if (!secretKey || !priceId) {
          return textError(
            "Payments aren't configured yet. The site owner needs to set STRIPE_SECRET_KEY and STRIPE_PRICE_ID in their host's environment variables.",
            501,
          );
        }

        let origin = "";
        try {
          const body = (await request.json()) as Body;
          if (typeof body.origin === "string") origin = body.origin;
        } catch {
          // no body — fall back to request origin below
        }
        if (!origin) origin = new URL(request.url).origin;

        const params = new URLSearchParams();
        params.set("mode", "subscription");
        params.set("line_items[0][price]", priceId);
        params.set("line_items[0][quantity]", "1");
        params.set("success_url", `${origin}/upgrade?session_id={CHECKOUT_SESSION_ID}`);
        params.set("cancel_url", `${origin}/upgrade`);
        params.set("allow_promotion_codes", "true");

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!stripeRes.ok) {
          const detail = await stripeRes.text().catch(() => "");
          return textError(`Stripe error: ${detail || stripeRes.statusText}`, stripeRes.status);
        }

        const session = await stripeRes.json();
        return new Response(JSON.stringify({ url: session.url }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
