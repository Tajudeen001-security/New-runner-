import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Github, Loader2, Package, Plus, Sparkles, Trash2, X } from "lucide-react";
import { K, lsGet, lsSet, uid, DEFAULT_SETTINGS, getSettings, type Settings, type Skill } from "../lib/storage";
import { BUILTIN_SKILLS } from "../lib/skills";
import { nvidiaChat } from "../lib/nvidia";

export const Route = createFileRoute("/skills")({
  component: SkillsPage,
  head: () => ({
    meta: [
      { title: "Skills — JagX Dev" },
      {
        name: "description",
        content:
          "Install skills to extend your JagX Dev agent. Each skill is a reusable instruction pack.",
      },
    ],
  }),
});

function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showGithub, setShowGithub] = useState(false);

  useEffect(() => {
    // Merge stored skills with built-ins (in case new built-ins were added)
    const stored = lsGet<Skill[]>(K.skills, []);
    const merged: Skill[] = BUILTIN_SKILLS.map((b) => {
      const found = stored.find((s) => s.id === b.id);
      return found ? { ...b, installed: found.installed } : b;
    });
    const custom = stored.filter((s) => !s.builtin);
    const final = [...merged, ...custom];
    setSkills(final);
    lsSet(K.skills, final);
    setHydrated(true);
  }, []);

  function persist(next: Skill[]) {
    setSkills(next);
    lsSet(K.skills, next);
  }

  function toggle(id: string) {
    const next = skills.map((s) =>
      s.id === id ? { ...s, installed: !s.installed } : s,
    );
    persist(next);
    const s = next.find((x) => x.id === id)!;
    toast.success(s.installed ? `Installed ${s.name}` : `Uninstalled ${s.name}`);
  }

  function remove(id: string) {
    const next = skills.filter((s) => s.id !== id);
    persist(next);
    toast.success("Skill removed");
  }

  function addCustom(name: string, description: string, instructions: string) {
    const skill: Skill = {
      id: uid(),
      name,
      description,
      instructions,
      builtin: false,
      installed: true,
      createdAt: Date.now(),
      source: "custom",
    };
    persist([...skills, skill]);
    toast.success(`Added ${name}`);
  }

  function addFromGithub(skill: { name: string; description: string; instructions: string; url: string }) {
    const record: Skill = {
      id: uid(),
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      builtin: false,
      installed: true,
      createdAt: Date.now(),
      source: "github",
      sourceUrl: skill.url,
    };
    persist([...skills, record]);
    toast.success(`Installed ${skill.name} from GitHub`);
  }

  if (!hydrated) return null;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-gold-gradient">Skills</span> library
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Install skills to extend JagX Dev. Active skills are injected into every
            conversation as system instructions.
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <button
            onClick={() => setShowGithub(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-gold/60"
          >
            <Github className="h-4 w-4" /> From GitHub
          </button>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gold-gradient px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            <Plus className="h-4 w-4" /> New skill
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-3">
        {skills.map((s) => (
          <SkillCard
            key={s.id}
            skill={s}
            onToggle={() => toggle(s.id)}
            onRemove={s.builtin ? undefined : () => remove(s.id)}
          />
        ))}
      </div>

      {showNew && <NewSkillDialog onClose={() => setShowNew(false)} onAdd={addCustom} />}
      {showGithub && (
        <GithubSkillDialog onClose={() => setShowGithub(false)} onAdd={addFromGithub} />
      )}
    </main>
  );
}

function SkillCard({
  skill,
  onToggle,
  onRemove,
}: {
  skill: Skill;
  onToggle: () => void;
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/70 bg-card p-4">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${
            skill.installed ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"
          }`}
        >
          <Package className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{skill.name}</h3>
            {skill.builtin && (
              <span className="rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                Built-in
              </span>
            )}
            {skill.source === "github" && (
              <a
                href={skill.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              >
                <Github className="h-3 w-3" /> GitHub
              </a>
            )}
            {skill.installed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                <Check className="h-3 w-3" /> Installed
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{skill.description}</p>
          {open && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border/60 bg-background p-3 font-mono text-xs leading-relaxed text-muted-foreground">
              {skill.instructions}
            </pre>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={onToggle}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                skill.installed
                  ? "border border-border bg-background text-foreground"
                  : "bg-gold-gradient text-primary-foreground shadow-gold"
              }`}
            >
              {skill.installed ? "Uninstall" : "Install"}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {open ? "Hide" : "View"} instructions
            </button>
            {onRemove && (
              <button
                onClick={onRemove}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GithubSkillDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (skill: { name: string; description: string; instructions: string; url: string }) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{
    name: string;
    description: string;
    instructions: string;
    url: string;
  } | null>(null);

  function candidateUrls(input: string): string[] {
    const clean = input.trim().replace(/\s+$/, "");
    if (/raw\.githubusercontent\.com/.test(clean) || /gist\.githubusercontent\.com/.test(clean)) {
      return [clean];
    }
    const blob = clean.match(/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
    if (blob) {
      const [, owner, repo, branch, path] = blob;
      return [`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`];
    }
    const repo = clean.match(/github\.com\/([^/]+)\/([^/]+?)\/?$/);
    if (repo) {
      const [, owner, name] = repo;
      const branches = ["main", "master"];
      const paths = ["SKILL.md", "skill.md", ".github/SKILL.md", "README.md"];
      return branches.flatMap((b) => paths.map((p) => `https://raw.githubusercontent.com/${owner}/${name}/${b}/${p}`));
    }
    return [clean];
  }

  function parseContent(raw: string, fallbackName: string) {
    const front = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
    if (front) {
      const meta: Record<string, string> = {};
      for (const line of front[1].split("\n")) {
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (m) meta[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, "");
      }
      return {
        name: meta.name || fallbackName,
        description: meta.description || "",
        instructions: front[2].trim() || raw.trim(),
      };
    }
    const named = raw.match(/(?:^|\n)Name:\s*(.+)/i);
    const described = raw.match(/(?:^|\n)Description:\s*(.+)/i);
    const withInstructions = raw.match(/(?:^|\n)Instructions:\s*([\s\S]+)/i);
    if (named || withInstructions) {
      return {
        name: named?.[1]?.trim() || fallbackName,
        description: described?.[1]?.trim() || "",
        instructions: withInstructions?.[1]?.trim() || raw.trim(),
      };
    }
    const firstLine = raw.trim().split("\n")[0]?.replace(/^#+\s*/, "").trim();
    return {
      name: firstLine?.slice(0, 60) || fallbackName,
      description: `Imported skill from GitHub`,
      instructions: raw.trim().slice(0, 12000),
    };
  }

  async function fetchSkill() {
    if (!url.trim()) {
      toast.error("Paste a GitHub file or repo URL");
      return;
    }
    setLoading(true);
    setPreview(null);
    try {
      const candidates = candidateUrls(url);
      let content: string | null = null;
      let hitUrl = url.trim();
      for (const c of candidates) {
        try {
          const res = await fetch(c);
          if (res.ok) {
            content = await res.text();
            hitUrl = c;
            break;
          }
        } catch {
          // try next candidate
        }
      }
      if (!content) {
        toast.error("Couldn't find a readable file at that URL (tried SKILL.md, README.md).");
        return;
      }
      const fallbackName = hitUrl.split("/").slice(-2, -1)[0] || "GitHub Skill";
      const parsed = parseContent(content, fallbackName);
      setPreview({ ...parsed, url: hitUrl });
    } catch (err: any) {
      toast.error(err?.message ?? "Fetch failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-elegant">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Install skill from GitHub</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Paste a repo URL (we'll look for SKILL.md) or a direct file link.
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-gold/50"
          />
          <button
            onClick={fetchSkill}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium hover:border-gold/60 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Github className="h-3.5 w-3.5" />}
            Fetch
          </button>
        </div>

        {preview && (
          <div className="mt-4 space-y-2 rounded-md border border-border/60 bg-background/50 p-3 text-sm">
            <p className="font-semibold">{preview.name}</p>
            {preview.description && (
              <p className="text-xs text-muted-foreground">{preview.description}</p>
            )}
            <pre className="max-h-48 overflow-auto rounded-md border border-border/60 bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
              {preview.instructions}
            </pre>
            <p className="truncate text-[10px] text-muted-foreground/70">{preview.url}</p>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md border border-border px-3 py-2 text-sm">
            Cancel
          </button>
          <button
            onClick={() => {
              if (!preview) {
                toast.error("Fetch a skill first");
                return;
              }
              onAdd(preview);
              onClose();
            }}
            className="rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            Install skill
          </button>
        </div>
      </div>
    </div>
  );
}

function NewSkillDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, description: string, instructions: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);

  function submit() {
    if (!name.trim() || !instructions.trim()) {
      toast.error("Name and instructions are required");
      return;
    }
    onAdd(name.trim(), description.trim(), instructions.trim());
    onClose();
  }

  function parseGeneratedSkill(text: string) {
    const nameMatch = text.match(/(?:^|\n)Name:\s*(.+)/i);
    const descriptionMatch = text.match(/(?:^|\n)Description:\s*(.+)/i);
    const instructionsMatch = text.match(/(?:^|\n)Instructions:\s*([\s\S]+)/i);
    return {
      name: nameMatch?.[1]?.trim() ?? "",
      description: descriptionMatch?.[1]?.trim() ?? "",
      instructions: instructionsMatch?.[1]?.trim() ?? text.trim(),
    };
  }

  async function generateSkill() {
    const idea = brief.trim();
    if (!idea) {
      toast.error("Describe the skill you want");
      return;
    }
    const settings = getSettings();
    if (!settings.nvidiaApiKey) {
      toast.error("Add your NVIDIA API key in Settings first");
      return;
    }

    setGenerating(true);
    try {
      const text = await nvidiaChat({
        apiKey: settings.nvidiaApiKey,
        model: settings.model,
        temperature: 0.35,
        messages: [
          {
            role: "system",
            content:
              "Create reusable AI agent skills. Return exactly three sections: Name:, Description:, Instructions:. Keep instructions operational and concise.",
          },
          {
            role: "user",
            content: `Create a JagX Dev skill for this need: ${idea}`,
          },
        ],
      });
      const generated = parseGeneratedSkill(text);
      setName(generated.name || idea.slice(0, 42));
      setDescription(generated.description || `Reusable skill for ${idea}`);
      setInstructions(generated.instructions);
      toast.success("Skill drafted");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not generate skill");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-elegant">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Create custom skill</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 rounded-md border border-border/60 bg-background/50 p-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Generate from a brief
            </span>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={3}
              placeholder="A skill that makes the assistant act like a senior React architect and always include tests…"
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-xs outline-none focus:border-gold/50"
            />
          </label>
          <button
            onClick={generateSkill}
            disabled={generating}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:border-gold/60 disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-gold" />}
            Generate skill
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Copy Editor"
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-gold/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Description
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Polishes marketing copy"
              className="w-full rounded-md border border-border bg-background px-3 py-2 outline-none focus:border-gold/50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Instructions (system prompt)
            </span>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={6}
              placeholder="You are a senior copy editor. When given text, tighten it, remove filler, and…"
              className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 font-mono text-xs outline-none focus:border-gold/50"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
          >
            Add skill
          </button>
        </div>
      </div>
    </div>
  );
}
