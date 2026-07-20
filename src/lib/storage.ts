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
};

/** A single file in a project's virtual workspace. */
export type ProjectFile = {
  path: string;
  lang: string;
  content: string;
};

export const K = {
  projects: "jagx:projects",
  messages: (projectId: string) => `jagx:messages:${projectId}`,
  /** Legacy: last rendered preview HTML (kept for old single-file projects). */
  code: (projectId: string) => `jagx:code:${projectId}`,
  /** Full multi-file workspace for a project. */
  files: (projectId: string) => `jagx:files:${projectId}`,
  skills: "jagx:skills",
  settings: "jagx:settings",
};

export const DEFAULT_SETTINGS: Settings = {
  nvidiaApiKey: "",
  model: "nvidia/nemotron-3-super-120b-a12b",
  temperature: 0.5,
  maxTokens: 16000,
};

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
