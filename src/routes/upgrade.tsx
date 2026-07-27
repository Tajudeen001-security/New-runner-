import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkles } from "lucide-react";
import { checkPro, saveLicenseToken, startCheckout } from "../lib/license";

export const Route = createFileRoute("/upgrade")({
  component: UpgradePage,
});

const FREE_FEATURES = [
  "Fast & balanced NVIDIA models",
  "Up to 8,000 output tokens per build",
  "3 active skills at a time",
  "Unlimited local projects",
];

const PRO_FEATURES = [
  "Every model, including flagship (Nemotron 3 Ultra, GPT-OSS 120B, Llama 3.1 405B...)",
  "Up to 32,000 output tokens per build — full apps in one turn",
  "Unlimited active skills",
  "Priority reasoning visibility & longer context",
];

function UpgradePage() {
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error" | "checking-out">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [isPro, setIsPro] = useState(false);
  const [licenseCode, setLicenseCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (sessionId) {
      setStatus("verifying");
      fetch(`/api/verify-session?session_id=${encodeURIComponent(sessionId)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(await res.text());
          return res.json();
        })
        .then((data) => {
          if (data.pro && data.token) {
            saveLicenseToken(data.token);
            setIsPro(true);
            setStatus("success");
          } else {
            setStatus("error");
            setErrorMsg("Payment wasn't confirmed yet — if you just paid, refresh in a moment.");
          }
        })
        .catch((err) => {
          setStatus("error");
          setErrorMsg(err.message || "Couldn't verify your payment");
        });
      // Clean the session_id out of the URL so refreshing doesn't re-verify.
      window.history.replaceState({}, "", "/upgrade");
    } else {
      checkPro().then(setIsPro);
    }
  }, []);

  async function handleUpgrade() {
    setStatus("checking-out");
    try {
      await startCheckout();
    } catch (err: any) {
      setStatus("idle");
      toast.error(err.message || "Couldn't start checkout — payments may not be configured yet.");
    }
  }

  async function redeemCode() {
    const code = licenseCode.trim();
    if (!code) return;
    setRedeeming(true);
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const text = await res.text();
      if (!res.ok) {
        toast.error(text || "Couldn't redeem that code");
        return;
      }
      const data = JSON.parse(text);
      if (data.pro && data.token) {
        saveLicenseToken(data.token);
        setIsPro(true);
        setLicenseCode("");
        toast.success("Code redeemed — you're Pro on this device!");
      } else {
        toast.error("That code didn't work");
      }
    } catch (err: any) {
      toast.error(err.message || "Couldn't reach the server");
    } finally {
      setRedeeming(false);
    }
  }

  if (status === "verifying") {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-md flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 gold-ring">
          <Sparkles className="h-6 w-6 text-gold" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">You're Pro 🎉</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Flagship models and the full 32,000-token build limit are unlocked on this device.
        </p>
        <Link
          to="/"
          className="mt-6 rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
        >
          Start building
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div className="text-center">
        <h1
          className="text-3xl font-semibold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Simple pricing
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {isPro ? "You're on Pro on this device." : "Start free. Upgrade when you need the flagship models."}
        </p>
        {status === "error" && (
          <p className="mx-auto mt-3 max-w-md rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMsg}
          </p>
        )}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/40 p-6">
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-1 text-sm text-muted-foreground">Everything you need to prototype.</p>
          <p className="mt-4 text-3xl font-semibold">$0</p>
          <ul className="mt-6 space-y-3 text-sm">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
                <span className="text-muted-foreground">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative rounded-xl border-2 border-gold/50 bg-card p-6 shadow-gold">
          <span className="absolute -top-3 left-6 rounded-full bg-gold-gradient px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
            Pro
          </span>
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="mt-1 text-sm text-muted-foreground">For real, full builds.</p>
          <p className="mt-4 text-3xl font-semibold">
            $19 <span className="text-sm font-normal text-muted-foreground">/ month</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-none text-gold" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="mt-6 inline-flex items-center gap-2 rounded-md border border-gold/40 px-4 py-2 text-sm font-semibold text-gold">
              <Check className="h-4 w-4" /> Active on this device
            </div>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={status === "checking-out"}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold disabled:opacity-60"
            >
              {status === "checking-out" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to checkout…
                </>
              ) : (
                "Upgrade to Pro"
              )}
            </button>
          )}
        </div>
      </div>

      {!isPro && (
        <div className="mx-auto mt-10 max-w-md rounded-xl border border-border/60 bg-card/40 p-5 text-center">
          <p className="text-sm font-medium">Paid another way (bank transfer, etc.)?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the license code you were given to activate Pro on this device.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={licenseCode}
              onChange={(e) => setLicenseCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && redeemCode()}
              placeholder="jagX-XXXXX-XXXXX-JRILICENSE-XXXXX"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-gold/60"
            />
            <button
              onClick={redeemCode}
              disabled={redeeming || !licenseCode.trim()}
              className="inline-flex items-center gap-1.5 rounded-md border border-gold/50 px-3 py-2 text-xs font-semibold text-gold hover:bg-gold/10 disabled:opacity-50"
            >
              {redeeming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Redeem"}
            </button>
          </div>
        </div>
      )}

      <p className="mx-auto mt-8 max-w-lg text-center text-xs text-muted-foreground">
        Pro status is tied to this browser/device (no account system yet), verified against your
        payment on our server — not something a person can fake by editing local storage.
      </p>
    </main>
  );
}
