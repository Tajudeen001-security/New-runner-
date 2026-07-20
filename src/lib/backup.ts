// Backup: export/import everything the app stores in localStorage.

import {
  K,
  lsGet,
  lsSet,
  DEFAULT_SETTINGS,
  getSettings,
  type ChatMessage,
  type Project,
  type Settings,
  type Skill,
} from "./storage";
import type { GeneratedFile } from "./skills";

export type Backup = {
  format: "jagx-dev.backup";
  version: 1;
  exportedAt: string;
  app: "JagX Dev";
  data: {
    settings: Settings;
    projects: Project[];
    skills: Skill[];
    messages: Record<string, ChatMessage[]>;
    /** Legacy single-file preview HTML, kept for old backups. */
    code: Record<string, string>;
    /** Full multi-file workspace per project. */
    files: Record<string, GeneratedFile[]>;
  };
};

export function buildBackup(): Backup {
  const projects = lsGet<Project[]>(K.projects, []);
  const messages: Record<string, ChatMessage[]> = {};
  const code: Record<string, string> = {};
  const files: Record<string, GeneratedFile[]> = {};
  for (const p of projects) {
    messages[p.id] = lsGet<ChatMessage[]>(K.messages(p.id), []);
    const html = lsGet<string>(K.code(p.id), "");
    if (html) code[p.id] = html;
    const projectFiles = lsGet<GeneratedFile[]>(K.files(p.id), []);
    if (projectFiles.length) files[p.id] = projectFiles;
  }
  return {
    format: "jagx-dev.backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    app: "JagX Dev",
    data: {
      settings: getSettings(),
      projects,
      skills: lsGet<Skill[]>(K.skills, []),
      messages,
      code,
      files,
    },
  };
}

export function downloadBackup() {
  const backup = buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `jagx-dev-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return {
    projects: backup.data.projects.length,
    skills: backup.data.skills.length,
    messages: Object.values(backup.data.messages).reduce((n, m) => n + m.length, 0),
  };
}

export type ImportMode = "replace" | "merge";

export type ImportResult = {
  projects: number;
  skills: number;
  messages: number;
};

export type RestorePreview = {
  mode: ImportMode;
  settings: {
    willReplace: boolean;
    currentModel: string;
    incomingModel: string;
    keyChanges: number;
  };
  projects: {
    added: Project[];
    replaced: Project[];
    removed: Project[];
    finalCount: number;
  };
  skills: {
    added: Skill[];
    replaced: Skill[];
    removed: Skill[];
    finalCount: number;
  };
  chats: {
    replacedProjectIds: string[];
    mergedProjectIds: string[];
    removedProjectIds: string[];
    incomingMessages: number;
    finalMessages: number;
  };
};

export function validateBackup(raw: unknown): Backup {
  if (!raw || typeof raw !== "object") throw new Error("Not a JSON object");
  const b = raw as Partial<Backup>;
  if (b.format !== "jagx-dev.backup") {
    throw new Error("Not a JagX Dev backup file");
  }
  if (b.version !== 1) {
    throw new Error(`Unsupported backup version: ${b.version}`);
  }
  if (!b.data || typeof b.data !== "object") throw new Error("Missing data section");
  return b as Backup;
}

export function parseBackupText(text: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("File is not valid JSON");
  }
  return validateBackup(json);
}

function changedSettingsCount(current: Settings, incoming: Settings) {
  const keys = Object.keys({ ...current, ...incoming }) as (keyof Settings)[];
  return keys.filter((key) => current[key] !== incoming[key]).length;
}

export function buildRestorePreview(backup: Backup, mode: ImportMode): RestorePreview {
  const d = backup.data;
  const currentSettings = getSettings();
  const incomingSettings = d.settings ?? DEFAULT_SETTINGS;
  const currentProjects = lsGet<Project[]>(K.projects, []);
  const currentSkills = lsGet<Skill[]>(K.skills, []);
  const incomingProjects = d.projects ?? [];
  const incomingSkills = d.skills ?? [];

  const currentProjectIds = new Set(currentProjects.map((p) => p.id));
  const incomingProjectIds = new Set(incomingProjects.map((p) => p.id));
  const currentSkillIds = new Set(currentSkills.map((s) => s.id));
  const incomingSkillIds = new Set(incomingSkills.map((s) => s.id));

  const addedProjects = incomingProjects.filter((p) => !currentProjectIds.has(p.id));
  const replacedProjects = incomingProjects.filter((p) => currentProjectIds.has(p.id));
  const removedProjects =
    mode === "replace" ? currentProjects.filter((p) => !incomingProjectIds.has(p.id)) : [];

  const addedSkills = incomingSkills.filter((s) => !currentSkillIds.has(s.id));
  const replacedSkills = incomingSkills.filter((s) => currentSkillIds.has(s.id));
  const removedSkills =
    mode === "replace" ? currentSkills.filter((s) => !incomingSkillIds.has(s.id)) : [];

  const incomingMessageEntries = Object.entries(d.messages ?? {});
  const incomingMessages = incomingMessageEntries.reduce((n, [, msgs]) => n + msgs.length, 0);
  const mergedProjectIds: string[] = [];
  const replacedProjectIds: string[] = [];
  let finalMessages = 0;

  if (mode === "merge") {
    for (const [pid, incoming] of incomingMessageEntries) {
      const existing = lsGet<ChatMessage[]>(K.messages(pid), []);
      const ids = new Set(existing.map((m) => m.id));
      const additions = incoming.filter((m) => !ids.has(m.id)).length;
      if (additions > 0 || existing.length > 0) mergedProjectIds.push(pid);
      finalMessages += existing.length + additions;
    }
  } else {
    replacedProjectIds.push(...incomingMessageEntries.map(([pid]) => pid));
    finalMessages = incomingMessages;
  }

  return {
    mode,
    settings: {
      willReplace: true,
      currentModel: currentSettings.model,
      incomingModel: incomingSettings.model,
      keyChanges: changedSettingsCount(currentSettings, incomingSettings),
    },
    projects: {
      added: addedProjects,
      replaced: replacedProjects,
      removed: removedProjects,
      finalCount:
        mode === "merge"
          ? new Set([...currentProjectIds, ...incomingProjectIds]).size
          : incomingProjects.length,
    },
    skills: {
      added: addedSkills,
      replaced: replacedSkills,
      removed: removedSkills,
      finalCount:
        mode === "merge" ? new Set([...currentSkillIds, ...incomingSkillIds]).size : incomingSkills.length,
    },
    chats: {
      replacedProjectIds,
      mergedProjectIds,
      removedProjectIds: removedProjects.map((p) => p.id),
      incomingMessages,
      finalMessages,
    },
  };
}

export function applyBackup(backup: Backup, mode: ImportMode): ImportResult {
  const d = backup.data;

  // Settings — always replace (single object)
  if (d.settings) lsSet(K.settings, { ...DEFAULT_SETTINGS, ...d.settings });

  // Skills — merge by id, incoming wins for duplicates
  const existingSkills = lsGet<Skill[]>(K.skills, []);
  const mergedSkillsMap = new Map<string, Skill>();
  if (mode === "merge") {
    for (const s of existingSkills) mergedSkillsMap.set(s.id, s);
  }
  for (const s of d.skills ?? []) mergedSkillsMap.set(s.id, s);
  const finalSkills = Array.from(mergedSkillsMap.values());
  lsSet(K.skills, finalSkills);

  // Projects — merge by id, incoming wins
  const existingProjects = lsGet<Project[]>(K.projects, []);
  const projMap = new Map<string, Project>();
  if (mode === "merge") {
    for (const p of existingProjects) projMap.set(p.id, p);
  } else {
    // In replace mode, drop chats/code for projects not in the backup
    for (const p of existingProjects) {
      if (!d.projects?.some((np) => np.id === p.id)) {
        window.localStorage.removeItem(K.messages(p.id));
        window.localStorage.removeItem(K.code(p.id));
        window.localStorage.removeItem(K.files(p.id));
      }
    }
  }
  for (const p of d.projects ?? []) projMap.set(p.id, p);
  const finalProjects = Array.from(projMap.values()).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
  lsSet(K.projects, finalProjects);

  // Per-project messages & code
  let totalMessages = 0;
  for (const [pid, msgs] of Object.entries(d.messages ?? {})) {
    if (mode === "merge") {
      const existing = lsGet<ChatMessage[]>(K.messages(pid), []);
      const ids = new Set(existing.map((m) => m.id));
      const merged = [...existing, ...msgs.filter((m) => !ids.has(m.id))];
      lsSet(K.messages(pid), merged);
      totalMessages += merged.length;
    } else {
      lsSet(K.messages(pid), msgs);
      totalMessages += msgs.length;
    }
  }
  for (const [pid, html] of Object.entries(d.code ?? {})) {
    lsSet(K.code(pid), html);
  }
  for (const [pid, projectFiles] of Object.entries(d.files ?? {})) {
    lsSet(K.files(pid), projectFiles);
  }

  return {
    projects: finalProjects.length,
    skills: finalSkills.length,
    messages: totalMessages,
  };
}

export async function importFromFile(file: File, mode: ImportMode): Promise<ImportResult> {
  const text = await file.text();
  const backup = parseBackupText(text);
  return applyBackup(backup, mode);
}
