import { createFileRoute } from "@tanstack/react-router";
import { createHmac, createHash } from "node:crypto";
import { VALID_CODE_HASHES } from "../../lib/license-codes.server";

function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function hashCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

const RECHECK_INTERVAL_MS = 1000 * 60 * 60 * 24 * 30; // same 30-day window as the Stripe flow

// Vercel KV / Upstash Redis, added from your Vercel project's Storage tab
// (free tier). Talks to the REST API directly instead of pulling in an SDK —
// Upstash's REST API takes a Redis command as a JSON array in the POST body,
// e.g. ["SET", "key", "value", "NX"], and returns { result: ... }.
async function redisCommand(command: (string | number)[]): Promise<{ ok: boolean; result: any }> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return { ok: false, result: null };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) return { ok: false, result: null };
    const data = await res.json().catch(() => null);
    if (!data || data.error) return { ok: false, result: null };
    return { ok: true, result: data.result ?? null };
  } catch {
    return { ok: false, result: null };
  }
}

async function kvGet(key: string): Promise<string | null> {
  const { ok, result } = await redisCommand(["GET", key]);
  return ok ? result ?? null : null;
}

async function kvSetIfAbsent(key: string, value: string): Promise<boolean> {
  // SET key value NX — only sets if the key doesn't already exist, which is
  // what makes redemption atomic and single-use even if two requests race.
  // Returns "OK" if it was set, or null if the key already existed.
  const { ok, result } = await redisCommand(["SET", key, value, "NX"]);
  return ok && result === "OK";
}

type Body = { code?: unknown };

export const Route = createFileRoute("/api/redeem-code")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const signingSecret = process.env.LICENSE_SIGNING_SECRET;
        if (!signingSecret) {
          return textError(
            "Payments aren't configured yet. The site owner needs to set LICENSE_SIGNING_SECRET.",
            501,
          );
        }
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
          return textError(
            "Code redemption needs storage configured. The site owner should add Vercel KV (or Upstash Redis) " +
              "from the project's Storage tab, which sets KV_REST_API_URL and KV_REST_API_TOKEN automatically.",
            501,
          );
        }

        let code = "";
        try {
          const body = (await request.json()) as Body;
          if (typeof body.code === "string") code = body.code;
        } catch {
          return textError("Invalid request body", 400);
        }
        code = code.trim();
        if (!code) return textError("Enter a code", 400);

        const upper = code.toUpperCase();
        if (!upper.startsWith("JAGX-") || !upper.includes("JRILICENSE")) {
          return textError("That doesn't look like a valid JagX license code.", 400);
        }

        const hash = hashCode(code);
        if (!VALID_CODE_HASHES.has(hash)) {
          return textError("That code isn't recognized. Check for typos and try again.", 400);
        }

        const claimed = await kvSetIfAbsent(`jagx_license_used:${hash}`, String(Date.now()));
        if (!claimed) {
          // Either already redeemed, or KV had a transient issue — check which.
          const existing = await kvGet(`jagx_license_used:${hash}`);
          if (existing) {
            return textError("This code has already been redeemed.", 409);
          }
          return textError("Couldn't reach storage to verify this code — try again in a moment.", 503);
        }

        const exp = Date.now() + RECHECK_INTERVAL_MS;
        const payloadB64 = Buffer.from(JSON.stringify({ code: hash, exp })).toString("base64url");
        const token = `${payloadB64}.${sign(payloadB64, signingSecret)}`;

        return new Response(JSON.stringify({ pro: true, token, exp }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
