import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Download, Eye, EyeOff, Upload, X } from "lucide-react";
import { K, lsGet, lsSet, DEFAULT_SETTINGS, type Settings } from "../lib/storage";
import { NVIDIA_MODELS } from "../lib/nvidia";
import {
  applyBackup,
  buildRestorePreview,
  downloadBackup,
  parseBackupText,
  type Backup,
  type ImportMode,
  type RestorePreview,
} from "../lib/backup";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — JagX Dev" },
      {
        name: "description",
        content: "Configure your NVIDIA key, default model, and back up your work.",
      },
    ],
  }),
});

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [reveal, setReveal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [pendingRestore, setPendingRestore] = useState<{
    backup: Backup;
    preview: RestorePreview;
    fileName: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(lsGet<Settings>(K.settings, DEFAULT_SETTINGS));
    setHydrated(true);
  }, []);

  function update<Field extends keyof Settings>(field: Field, value: Settings[Field]) {
    const next = { ...settings, [field]: value };
    setSettings(next);
    lsSet(K.settings, next);
  }

  function handleExport() {
    try {
      const stats = downloadBackup();
      toast.success(
        `Backup downloaded — ${stats.projects} project${stats.projects === 1 ? "" : "s"}, ${stats.messages} message${stats.messages === 1 ? "" : "s"}`,
      );
    } catch (err: any) {
      toast.error(err?.message ?? "Export failed");
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const backup = parseBackupText(await file.text());
      const preview = buildRestorePreview(backup, importMode);
      setPendingRestore({ backup, preview, fileName: file.name });
    } catch (err: any) {
      toast.error(err?.message ?? "Import failed");
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  function confirmRestore() {
    if (!pendingRestore) return;
    try {
      const res = applyBackup(pendingRestore.backup, pendingRestore.preview.mode);
      toast.success(
        `Restored — ${res.projects} project${res.projects === 1 ? "" : "s"}, ${res.skills} skill${res.skills === 1 ? "" : "s"}, ${res.messages} message${res.messages === 1 ? "" : "s"}`,
      );
      setSettings(lsGet<Settings>(K.settings, DEFAULT_SETTINGS));
      setPendingRestore(null);
    } catch (err: any) {
      toast.error(err?.message ?? "Import failed");
    }
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto max-w-2xl px-5 pt-12 pb-24">
      <div className="flex items-baseline justify-between border-b border-border/50 pb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Preferences</span>
        <span>Local to this browser</span>
      </div>

      <h1
        className="mt-8 text-4xl font-semibold tracking-tight"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Settings
      </h1>
      <p className="mt-2 text-[15px] text-muted-foreground">
        A short list of knobs. Change what you need and it's saved.
      </p>

      <div className="mt-12 space-y-12">
        {/* API key */}
        <Row
          label="01"
          title="NVIDIA API key"
          subtitle={
            <>
              Free from{" "}
              <a
                href="https://build.nvidia.com"
                target="_blank"
                rel="noreferrer"
                className="text-gold underline decoration-dotted underline-offset-4 hover:decoration-solid"
              >
                build.nvidia.com
              </a>
              . Stored on this device only.
            </>
          }
        >
          <div className="flex items-center gap-2">
            <input
              type={reveal ? "text" : "password"}
              value={settings.nvidiaApiKey}
              onChange={(e) => update("nvidiaApiKey", e.target.value)}
              placeholder="nvapi-…"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-gold/60"
            />
            <button
              onClick={() => setReveal((v) => !v)}
              className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
              aria-label={reveal ? "Hide key" : "Show key"}
            >
              {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </Row>

        {/* Model */}
        <Row
          label="02"
          title="Default model"
          subtitle="Pick a curated model, or paste any chat model ID from build.nvidia.com."
        >
          <div className="divide-y divide-border/60 border-y border-border/60">
            {NVIDIA_MODELS.map((m) => {
              const active = settings.model === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => update("model", m.id)}
                  className="flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-accent/40"
                >
                  <span
                    className={`inline-flex h-4 w-4 flex-none items-center justify-center rounded-full border ${
                      active ? "border-gold bg-gold" : "border-border"
                    }`}
                  >
                    {active && <Check className="h-3 w-3 text-primary-foreground" />}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
                      {m.label}
                      <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {m.family}
                      </span>
                      {m.badge && (
                        <span className="rounded-full bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                          {m.badge}
                        </span>
                      )}
                      <span className="text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
                        {m.context}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {m.hint}
                    </span>
                  </span>
                  <span className="hidden sm:block font-mono text-[10px] text-muted-foreground/60">
                    {m.id}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Custom NVIDIA model ID
            </span>
            <input
              value={settings.model}
              onChange={(e) => update("model", e.target.value.trim())}
              placeholder="nvidia/nemotron-3-super-120b-a12b"
              className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-gold/60"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Use the exact model slug from NVIDIA. If NVIDIA removes or renames a model, paste the current slug here.
            </p>
          </label>
        </Row>

        {/* Temperature */}
        <Row
          label="03"
          title="Temperature"
          subtitle="Low is careful, high is loose."
          aside={
            <span className="font-mono text-sm text-gold tabular-nums">
              {settings.temperature.toFixed(2)}
            </span>
          }
        >
          <input
            type="range"
            min={0}
            max={1.5}
            step={0.05}
            value={settings.temperature}
            onChange={(e) => update("temperature", parseFloat(e.target.value))}
            className="w-full accent-[color:var(--gold)]"
          />
          <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>Precise</span>
            <span>Playful</span>
          </div>
        </Row>

        {/* Response length */}
        <Row
          label="04"
          title="Response length"
          subtitle="Higher lets JagX write bigger multi-file apps in one turn without cutting off mid-file."
          aside={
            <span className="font-mono text-sm text-gold tabular-nums">
              {settings.maxTokens.toLocaleString()}
            </span>
          }
        >
          <input
            type="range"
            min={2000}
            max={32000}
            step={1000}
            value={settings.maxTokens}
            onChange={(e) => update("maxTokens", parseInt(e.target.value, 10))}
            className="w-full accent-[color:var(--gold)]"
          />
          <div className="mt-1 flex justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <span>Fast &amp; short</span>
            <span>Large builds</span>
          </div>
        </Row>

        {/* Backup */}
        <Row
          label="05"
          title="Backup & restore"
          subtitle="Everything — projects, chats, skills, settings — as a single JSON file."
        >
          <div className="rounded-lg border border-border/60 bg-card/50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-md bg-foreground px-3.5 py-2 text-[13px] font-medium text-background transition-colors hover:bg-gold hover:text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                Export JSON
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3.5 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-gold/60"
              >
                <Upload className="h-4 w-4" />
                Import JSON
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            <fieldset className="mt-4 border-t border-border/50 pt-3">
              <legend className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                On import
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <ModeOption
                  active={importMode === "merge"}
                  onClick={() => setImportMode("merge")}
                  title="Merge"
                  body="Keep what's here, add what's new. Duplicates prefer the backup."
                />
                <ModeOption
                  active={importMode === "replace"}
                  onClick={() => setImportMode("replace")}
                  title="Replace"
                  body="Wipe local data and restore the backup exactly."
                />
              </div>
            </fieldset>
          </div>
        </Row>
      </div>

      {pendingRestore && (
        <RestorePreviewDialog
          fileName={pendingRestore.fileName}
          preview={pendingRestore.preview}
          onCancel={() => setPendingRestore(null)}
          onConfirm={confirmRestore}
        />
      )}
    </main>
  );
}

function Row({
  label,
  title,
  subtitle,
  aside,
  children,
}: {
  label: string;
  title: string;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-4 sm:grid-cols-[80px_1fr]">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
        {label}
      </div>
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[17px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h2>
          {aside}
        </div>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </section>
  );
}

function ModeOption({
  active,
  onClick,
  title,
  body,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border p-3 text-left transition-colors ${
        active ? "border-gold/60 bg-gold/5" : "border-border/60 hover:border-border"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span
          className={`inline-flex h-3.5 w-3.5 flex-none items-center justify-center rounded-full border ${
            active ? "border-gold bg-gold" : "border-border"
          }`}
        >
          {active && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
        </span>
        {title}
      </div>
      <p className="mt-1 pl-5 text-xs text-muted-foreground">{body}</p>
    </button>
  );
}

function RestorePreviewDialog({
  fileName,
  preview,
  onCancel,
  onConfirm,
}: {
  fileName: string;
  preview: RestorePreview;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const projectChanges =
    preview.projects.added.length + preview.projects.replaced.length + preview.projects.removed.length;
  const skillChanges =
    preview.skills.added.length + preview.skills.replaced.length + preview.skills.removed.length;
  const chatProjects =
    preview.chats.replacedProjectIds.length +
    preview.chats.mergedProjectIds.length +
    preview.chats.removedProjectIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/80 p-3 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-card shadow-elegant">
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Restore preview · {preview.mode}
            </p>
            <h2 className="mt-1 text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Review before importing
            </h2>
            <p className="mt-1 break-all text-xs text-muted-foreground">{fileName}</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
            aria-label="Close restore preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[62vh] overflow-y-auto px-4 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <PreviewStat label="Projects affected" value={projectChanges} finalText={`${preview.projects.finalCount} after restore`} />
            <PreviewStat label="Chats affected" value={chatProjects} finalText={`${preview.chats.finalMessages} messages after restore`} />
            <PreviewStat label="Skills affected" value={skillChanges} finalText={`${preview.skills.finalCount} after restore`} />
            <PreviewStat label="Settings fields" value={preview.settings.keyChanges} finalText="settings will be replaced" />
          </div>

          <div className="mt-5 space-y-4">
            <PreviewSection
              title="Projects"
              added={preview.projects.added.map((p) => p.name)}
              replaced={preview.projects.replaced.map((p) => p.name)}
              removed={preview.projects.removed.map((p) => p.name)}
            />
            <PreviewSection
              title="Chats"
              added={[]}
              replaced={preview.mode === "merge" ? preview.chats.mergedProjectIds : preview.chats.replacedProjectIds}
              removed={preview.chats.removedProjectIds}
              labels={{ replaced: preview.mode === "merge" ? "Merged" : "Replaced" }}
              empty="No chat records in this backup."
            />
            <PreviewSection
              title="Skills"
              added={preview.skills.added.map((s) => s.name)}
              replaced={preview.skills.replaced.map((s) => s.name)}
              removed={preview.skills.removed.map((s) => s.name)}
            />
            <div className="rounded-md border border-border/60 p-3">
              <h3 className="text-sm font-semibold">Settings</h3>
              <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="rounded-md bg-background/60 p-2">
                  <span className="block uppercase tracking-[0.16em]">Current model</span>
                  <span className="mt-1 block break-all font-mono">{preview.settings.currentModel}</span>
                </div>
                <div className="rounded-md bg-background/60 p-2">
                  <span className="block uppercase tracking-[0.16em]">Incoming model</span>
                  <span className="mt-1 block break-all font-mono">{preview.settings.incomingModel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border/60 px-4 py-3 sm:flex-row sm:justify-end">
          <button onClick={onCancel} className="rounded-md border border-border px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            Confirm restore
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewStat({ label, value, finalText }: { label: string; value: number; finalText: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-background/50 p-3">
      <div className="font-mono text-2xl text-gold tabular-nums">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{finalText}</div>
    </div>
  );
}

function PreviewSection({
  title,
  added,
  replaced,
  removed,
  labels,
  empty = "No changes in this section.",
}: {
  title: string;
  added: string[];
  replaced: string[];
  removed: string[];
  labels?: Partial<Record<"added" | "replaced" | "removed", string>>;
  empty?: string;
}) {
  const hasChanges = added.length + replaced.length + removed.length > 0;
  return (
    <div className="rounded-md border border-border/60 p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {!hasChanges ? (
        <p className="mt-2 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <ChangeList label={labels?.added ?? "Added"} items={added} />
          <ChangeList label={labels?.replaced ?? "Replaced"} items={replaced} />
          <ChangeList label={labels?.removed ?? "Removed"} items={removed} danger />
        </div>
      )}
    </div>
  );
}

function ChangeList({ label, items, danger }: { label: string; items: string[]; danger?: boolean }) {
  return (
    <div>
      <p className={`text-[11px] uppercase tracking-[0.18em] ${danger ? "text-destructive" : "text-muted-foreground"}`}>
        {label} · {items.length}
      </p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground/70">None</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {items.slice(0, 6).map((item) => (
            <li key={item} className="truncate text-xs text-muted-foreground" title={item}>
              {item}
            </li>
          ))}
          {items.length > 6 && (
            <li className="text-xs text-muted-foreground/70">+{items.length - 6} more</li>
          )}
        </ul>
      )}
    </div>
  );
}
