import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function json(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const Route = createFileRoute("/api/license-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const signingSecret = process.env.LICENSE_SIGNING_SECRET;
        const url = new URL(request.url);
        const token = url.searchParams.get("token") ?? "";
        const [payloadB64, sig] = token.split(".");

        if (!signingSecret || !payloadB64 || !sig) return json({ pro: false });

        const expected = sign(payloadB64, signingSecret);
        let validSignature = false;
        try {
          validSignature =
            expected.length === sig.length &&
            timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
        } catch {
          validSignature = false;
        }
        if (!validSignature) return json({ pro: false });

        try {
          const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
          const pro = typeof payload.exp === "number" && payload.exp > Date.now();
          return json({ pro });
        } catch {
          return json({ pro: false });
        }
      },
    },
  },
});
