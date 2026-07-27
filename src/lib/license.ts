import { lsGet, lsSet } from "./storage";

const TOKEN_KEY = "jagx:license_token";
const CACHE_KEY = "jagx:license_cache";
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

type Cache = { pro: boolean; checkedAt: number };

export function saveLicenseToken(token: string) {
  lsSet(TOKEN_KEY, token);
  lsSet<Cache | null>(CACHE_KEY, null); // force a fresh check next time
}

export function clearLicense() {
  lsSet(TOKEN_KEY, null);
  lsSet<Cache | null>(CACHE_KEY, null);
}

export function getLicenseToken(): string | null {
  return lsGet<string | null>(TOKEN_KEY, null);
}

/**
 * Returns whether this browser currently has an active Pro license.
 * The actual yes/no decision always comes from the server (which holds the
 * signing secret) — this just caches that answer briefly so normal use
 * doesn't fire a network request on every render.
 */
export async function checkPro(force = false): Promise<boolean> {
  const token = getLicenseToken();
  if (!token) return false;

  if (!force) {
    const cached = lsGet<Cache | null>(CACHE_KEY, null);
    if (cached && Date.now() - cached.checkedAt < CACHE_TTL_MS) return cached.pro;
  }

  try {
    const res = await fetch(`/api/license-status?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    const pro = !!data.pro;
    lsSet<Cache>(CACHE_KEY, { pro, checkedAt: Date.now() });
    return pro;
  } catch {
    // Network hiccup — fall back to the last known answer rather than
    // silently downgrading someone mid-session.
    const cached = lsGet<Cache | null>(CACHE_KEY, null);
    return cached?.pro ?? false;
  }
}

export async function startCheckout(): Promise<void> {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin: window.location.origin }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(detail || "Couldn't start checkout");
  }
  const data = await res.json();
  if (!data.url) throw new Error("Stripe didn't return a checkout URL");
  window.location.href = data.url;
}
