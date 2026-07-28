import { createFileRoute } from "@tanstack/react-router";
import { randomBytes } from "node:crypto";

function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

async function kvSetWithExpiry(key: string, value: string, seconds: number): Promise<boolean> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return false;
  const res = await fetch(
    `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?EX=${seconds}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } },
  );
  return res.ok;
}

async function kvGet(key: string): Promise<string | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return data?.result ?? null;
}

type PostBody = { projectName?: unknown; files?: unknown };

export const Route = createFileRoute("/api/share")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
          return textError(
            "Sharing needs storage configured. Add Vercel KV (or Upstash Redis) from the project's Storage tab.",
            501,
          );
        }

        let body: PostBody;
        try {
          body = (await request.json()) as PostBody;
        } catch {
          return textError("Invalid request body", 400);
        }

        const files = Array.isArray(body.files) ? body.files : null;
        if (!files || files.length === 0) return textError("Nothing to share yet.", 400);
        const projectName = typeof body.projectName === "string" ? body.projectName : "Untitled";

        const cleanFiles = files
          .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string")
          .map((f: any) => ({ path: f.path, lang: f.lang || "text", content: f.content }));

        const slug = randomBytes(6).toString("base64url");
        const payload = JSON.stringify({ projectName, files: cleanFiles, createdAt: Date.now() });

        // A generous ceiling — KV has per-value size limits, and huge shared
        // payloads make for a slow public link anyway.
        if (payload.length > 900_000) {
          return textError("This project is too large to share as a link (try Export ZIP instead).", 413);
        }

        const ok = await kvSetWithExpiry(`jagx_share:${slug}`, payload, THIRTY_DAYS_SECONDS);
        if (!ok) return textError("Couldn't reach storage — try again in a moment.", 503);

        return json({ slug });
      },

      GET: async ({ request }) => {
        if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
          return textError("Sharing isn't configured on this deployment.", 501);
        }
        const url = new URL(request.url);
        const slug = url.searchParams.get("slug");
        if (!slug) return textError("Missing slug", 400);

        const raw = await kvGet(`jagx_share:${slug}`);
        if (!raw) return textError("This share link has expired or doesn't exist.", 404);

        return new Response(raw, { status: 200, headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
