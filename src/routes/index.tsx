import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, CornerDownLeft, Trash2 } from "lucide-react";
import { K, lsGet, lsSet, uid, type Project } from "../lib/storage";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "JagX Dev — AI development studio" },
      {
        name: "description",
        content:
          "A workshop for building software with NVIDIA models. Bring a prompt, leave with a working preview.",
      },
    ],
  }),
});

const STARTERS = [
  "A pomodoro timer with soft chimes",
  "A minimalist recipe finder",
  "A retro terminal-style resume",
  "A markdown scratchpad with local save",
];

function Home() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    setProjects(lsGet<Project[]>(K.projects, []));
    setHydrated(true);
  }, []);

  function createProject(name: string, description: string) {
    const p: Project = {
      id: uid(),
      name: name || "Untitled project",
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const next = [p, ...projects];
    setProjects(next);
    lsSet(K.projects, next);
    return p;
  }

  function handleStart() {
    if (!prompt.trim()) {
      toast.error("Describe what you want to build");
      return;
    }
    const p = createProject(prompt.slice(0, 40), prompt);
    lsSet(`jagx:messages:${p.id}`, [
      { id: uid(), role: "user", content: prompt, createdAt: Date.now() },
      { __pending: true },
    ]);
    navigate({ to: "/chat/$projectId", params: { projectId: p.id } });
  }

  function remove(id: string) {
    const next = projects.filter((p) => p.id !== id);
    setProjects(next);
    lsSet(K.projects, next);
    toast.success("Deleted");
  }

  return (
    <main className="mx-auto max-w-3xl px-5 pt-16 pb-24 sm:pt-24">
      {/* Masthead */}
      <div className="flex items-baseline justify-between border-b border-border/50 pb-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Issue 001 · Workshop</span>
        <span className="tabular-nums">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Hero */}
      <section className="pt-10 sm:pt-16">
        <p className="text-sm text-gold">— Welcome back</p>
        <h1
          className="mt-3 text-[2.5rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          What are we building
          <br />
          <span className="italic text-muted-foreground">this afternoon?</span>
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
          Type an idea. JagX drafts it with an NVIDIA model, streams the code, and
          renders a live preview beside the chat. Your work stays on this device.
        </p>

        {/* Prompt */}
        <div className="mt-8">
          <label
            htmlFor="idea"
            className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted-foreground"
          >
            <span>The brief</span>
            <span className="hidden sm:inline">
              ⌘ + <CornerDownLeft className="inline h-3 w-3" /> to send
            </span>
          </label>
          <div className="group relative rounded-lg border border-border bg-card/60 transition-colors focus-within:border-gold/60">
            <textarea
              id="idea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleStart();
              }}
              placeholder="A landing page for a small-batch coffee roaster in Kyoto — hero photo, menu, three testimonials, a quiet subscribe form…"
              className="min-h-[120px] w-full resize-none bg-transparent px-4 py-3.5 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center justify-between border-t border-border/50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Model ready
              </div>
              <button
                onClick={handleStart}
                className="group/btn inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-1.5 text-[13px] font-medium text-background transition-colors hover:bg-gold hover:text-primary-foreground"
              >
                Start
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted-foreground">
            <span className="text-muted-foreground/60">Try:</span>
            {STARTERS.map((s, i) => (
              <button
                key={s}
                onClick={() => setPrompt(s)}
                className="text-left underline decoration-border decoration-dotted underline-offset-4 hover:decoration-gold hover:text-foreground"
              >
                {s}
                {i < STARTERS.length - 1 && <span className="text-border">,</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mt-24">
        <div className="flex items-baseline justify-between border-b border-border/50 pb-3">
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The archive
          </h2>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {hydrated ? `${projects.length} saved` : ""}
          </span>
        </div>

        {!hydrated ? (
          <div className="h-24" />
        ) : projects.length === 0 ? (
          <p className="pt-8 text-center text-sm text-muted-foreground">
            Nothing here yet — the brief above will start your first entry.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border/50">
            {projects.map((p) => (
              <li key={p.id} className="group flex items-center gap-3 py-3.5">
                <Link
                  to="/chat/$projectId"
                  params={{ projectId: p.id }}
                  className="flex flex-1 items-baseline gap-4 min-w-0"
                >
                  <span className="w-14 flex-none font-mono text-[11px] tabular-nums text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                    })}
                  </span>
                  <span className="flex-1 truncate text-[15px] group-hover:text-gold">
                    {p.name}
                  </span>
                  <span className="hidden sm:block max-w-[40%] truncate text-[13px] text-muted-foreground">
                    {p.description}
                  </span>
                </Link>
                <button
                  onClick={() => remove(p.id)}
                  className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Colophon */}
      <footer className="mt-24 border-t border-border/50 pt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>JagX Dev — a workshop, not a factory</span>
          <span className="normal-case tracking-normal">
            Set: Space Grotesk & Inter · Runs on NVIDIA
          </span>
        </div>
      </footer>
    </main>
  );
}
