// LocalStorage helpers. All reads are SSR-safe.

export function isBrowser() {
  return typeof window !== "undefined";
}

export function lsGet<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function lsRemove(key: string) {
  if (!isBrowser()) return;
  window.localStorage.removeItem(key);
}

// ---- Domain types ----

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
};

export type Skill = {
  id: string;
  name: string;
  description: string;
  instructions: string;
  builtin?: boolean;
  installed: boolean;
  createdAt: number;
  /** Where the skill came from — used to show a small provenance badge. */
  source?: "builtin" | "custom" | "github";
  sourceUrl?: string;
};

export type Settings = {
  nvidiaApiKey: string;
  model: string;
  temperature: number;
  /** Max output tokens per turn. Multi-file builds need headroom. */
  maxTokens: number;
  /** On phones: jump to the Preview tab automatically when a build starts.
   * Off by default — press the Preview/Play button yourself, like Lovable. */
  autoPreview: boolean;
  /** Show the model's live reasoning/thinking text while it plans, for
   * models that stream a separate reasoning channel. */
  showReasoning: boolean;
  /** Let the agent pause and ask clarifying questions before building when
   * a request is genuinely ambiguous, instead of guessing. */
  askBeforeBuilding: boolean;
};

/** A single file in a project's virtual workspace. */
export type ProjectFile = {
  path: string;
  lang: string;
  content: string;
};

/** An environment variable the user has noted for a project. Stored locally
 * only — JagX never sends these to the model or anywhere else. They exist so
 * you have one place tracking what needs to be set in Vercel/`.env.local`. */
export type EnvVar = {
  id: string;
  key: string;
  value: string;
  /** Client-exposed vars are safe to ship in the bundle (e.g. NEXT_PUBLIC_/VITE_ prefixed).
   * Server-only vars (API keys, DB URLs) must never be prefixed that way. */
  scope: "server" | "client";
  note?: string;
};

export const K = {
  projects: "jagx:projects",
  messages: (projectId: string) => `jagx:messages:${projectId}`,
  /** Legacy: last rendered preview HTML (kept for old single-file projects). */
  code: (projectId: string) => `jagx:code:${projectId}`,
  /** Full multi-file workspace for a project. */
  files: (projectId: string) => `jagx:files:${projectId}`,
  /** Environment variable notes for a project (local-only, never sent anywhere). */
  envVars: (projectId: string) => `jagx:envvars:${projectId}`,
  skills: "jagx:skills",
  settings: "jagx:settings",
};

export const DEFAULT_SETTINGS: Settings = {
  nvidiaApiKey: "",
  model: "nvidia/nemotron-3-super-120b-a12b",
  temperature: 0.5,
  maxTokens: 16000,
  autoPreview: false,
  showReasoning: true,
  askBeforeBuilding: true,
};

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Always use this instead of a raw lsGet(K.settings, ...) — it fills in any
 * fields missing from settings saved by an older version of the app. */
export function getSettings(): Settings {
  const stored = lsGet<Partial<Settings>>(K.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}
