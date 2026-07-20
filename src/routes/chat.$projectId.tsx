import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronRight,
  Code2,
  Copy,
  Eye,
  FileCode2,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Square,
} from "lucide-react";
import {
  K,
  lsGet,
  lsSet,
  uid,
  DEFAULT_SETTINGS,
  type ChatMessage,
  type Project,
  type Settings,
  type Skill,
} from "../lib/storage";
import { modelLabel, nvidiaChat } from "../lib/nvidia";
import {
  buildSystemPrompt,
  buildPreviewDocument,
  extractDoneNote,
  extractGeneratedFiles,
  extractPlan,
  stripStructuredMarkup,
  BUILTIN_SKILLS,
  type GeneratedFile,
} from "../lib/skills";

export const Route = createFileRoute("/chat/$projectId")({
  component: ChatPage,
});

function ChatPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const [hydrated, setHydrated] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [reasoningText, setReasoningText] = useState("");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [mobileView, setMobileView] = useState<"chat" | "output">("chat");
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate
  useEffect(() => {
    const projects = lsGet<Project[]>(K.projects, []);
    const p = projects.find((x) => x.id === projectId) ?? null;
    setProject(p);
    setSettings(lsGet<Settings>(K.settings, DEFAULT_SETTINGS));
    const savedSkills = lsGet<Skill[]>(K.skills, BUILTIN_SKILLS);
    setSkills(savedSkills);

    const raw = lsGet<any[]>(K.messages(projectId), []);
    const clean = raw.filter((m) => m && !m.__pending) as ChatMessage[];
    setMessages(clean);

    let savedFiles = lsGet<GeneratedFile[]>(K.files(projectId), []);
    if (savedFiles.length === 0) {
      // migrate old single-HTML projects
      const legacyHtml = lsGet<string>(K.code(projectId), "");
      if (legacyHtml) savedFiles = [{ path: "index.html", lang: "html", content: legacyHtml }];
    }
    setFiles(savedFiles);
    setActiveFile(savedFiles[0]?.path ?? null);
    setHydrated(true);

    // Autorun if the seed message was queued from home
    const pending = raw.some((m) => m && m.__pending);
    if (pending && clean.length > 0 && clean[clean.length - 1].role === "user") {
      lsSet(K.messages(projectId), clean);
      setTimeout(() => runAssistant(clean, savedSkills, lsGet<Settings>(K.settings, DEFAULT_SETTINGS)), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText]);

  function persistMessages(next: ChatMessage[]) {
    setMessages(next);
    lsSet(K.messages(projectId), next);
    const projects = lsGet<Project[]>(K.projects, []);
    const updated = projects.map((p) =>
      p.id === projectId ? { ...p, updatedAt: Date.now() } : p,
    );
    lsSet(K.projects, updated);
  }

  function persistFiles(next: GeneratedFile[]) {
    setFiles(next);
    lsSet(K.files(projectId), next);
    if (next.length && !next.some((f) => f.path === activeFile)) {
      setActiveFile(next[0].path);
    }
  }

  async function runAssistant(base: ChatMessage[], skillList: Skill[], s: Settings) {
    if (!s.nvidiaApiKey) {
      toast.error("Add your NVIDIA API key in Settings first.");
      navigate({ to: "/settings" });
      return;
    }
    setStreaming(true);
    setStreamText("");
    setReasoningText("");
    setTab("preview");
    setMobileView("output");
    const ac = new AbortController();
    abortRef.current = ac;

    const systemPrompt = buildSystemPrompt(skillList);
    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...base.map((m) => ({ role: m.role, content: m.content })),
    ];

    let lastFileSignature = "";

    try {
      let acc = "";
      const full = await nvidiaChat({
        apiKey: s.nvidiaApiKey,
        model: s.model,
        messages: apiMessages,
        temperature: s.temperature,
        maxTokens: s.maxTokens,
        signal: ac.signal,
        onReasoning: (chunk) => setReasoningText((r) => r + chunk),
        onToken: (chunk) => {
          acc += chunk;
          setStreamText(acc);

          // Update the live file set (and the preview) the moment each file's
          // fence closes — this is what makes the build feel like it's
          // happening in front of you instead of appearing all at once.
          const liveFiles = extractGeneratedFiles(acc);
          const signature = liveFiles.map((f) => `${f.path}:${f.content.length}`).join("|");
          if (liveFiles.length && signature !== lastFileSignature) {
            lastFileSignature = signature;
            persistFiles(liveFiles);
          }
        },
      });

      const assistant: ChatMessage = {
        id: uid(),
        role: "assistant",
        content: full,
        createdAt: Date.now(),
      };
      const next = [...base, assistant];
      persistMessages(next);

      const finalFiles = extractGeneratedFiles(full);
      if (finalFiles.length) {
        persistFiles(finalFiles);
      } else {
        setMobileView("chat");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        toast.info("Stopped");
      } else {
        toast.error(err.message || "Something went wrong");
      }
    } finally {
      setStreaming(false);
      setStreamText("");
      setReasoningText("");
      abortRef.current = null;
    }
  }

  function send() {
    const text = input.trim();
    if (!text || streaming) return;
    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const next = [...messages, userMsg];
    persistMessages(next);
    setInput("");
    runAssistant(next, skills, settings);
  }

  function stop() {
    abortRef.current?.abort();
  }

  function regenerate() {
    if (streaming) return;
    let base = messages;
    if (base.length && base[base.length - 1].role === "assistant") {
      base = base.slice(0, -1);
      persistMessages(base);
    }
    if (base.length === 0) return;
    runAssistant(base, skills, settings);
  }

  const activeSkills = useMemo(() => skills.filter((s) => s.installed), [skills]);

  const previewDoc = useMemo(() => buildPreviewDocument(files), [files]);
  const previewSignature = useMemo(
    () => files.map((f) => `${f.path}:${f.content.length}`).join("|"),
    [files],
  );
  const selectedFile = useMemo(
    () => files.find((f) => f.path === activeFile) ?? files[0] ?? null,
    [files, activeFile],
  );

  // Live status derived from the in-flight stream, for the "building" card.
  const livePlan = useMemo(() => (streaming ? extractPlan(streamText) : []), [streaming, streamText]);
  const liveFiles = useMemo(
    () => (streaming ? extractGeneratedFiles(streamText) : []),
    [streaming, streamText],
  );
  const liveDone = useMemo(() => (streaming ? extractDoneNote(streamText) : null), [streaming, streamText]);

  if (!hydrated) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-xl font-semibold">Project not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted or created in another browser.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
        >
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:grid lg:grid-cols-[minmax(360px,480px)_1fr]">
      {/* Mobile-only top switcher — always visible, no scrolling to find the preview. */}
      <div className="flex flex-none items-center gap-1 border-b border-border/60 bg-background p-1.5 lg:hidden">
        <button
          onClick={() => setMobileView("chat")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            mobileView === "chat"
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" /> Chat
        </button>
        <button
          onClick={() => setMobileView("output")}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            mobileView === "output"
              ? "bg-gold-gradient text-primary-foreground shadow-gold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          Preview
          {streaming && <Loader2 className="h-3 w-3 animate-spin" />}
          {!streaming && files.length > 0 && (
            <span className="rounded-full bg-background/30 px-1.5 text-[10px]">{files.length}</span>
          )}
        </button>
      </div>

      {/* Chat pane */}
      <div
        className={`min-h-0 flex-1 flex-col border-r border-border/60 ${
          mobileView === "chat" ? "flex" : "hidden"
        } lg:flex`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="line-clamp-1">{project.name}</span>
          </Link>
          <span className="text-xs text-muted-foreground">
            {activeSkills.length} skill{activeSkills.length === 1 ? "" : "s"} · {modelLabel(settings.model)}
          </span>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {messages.length === 0 && !streaming && (
            <div className="rounded-xl border border-dashed border-border/70 bg-card/40 p-6 text-center text-sm text-muted-foreground">
              <Sparkles className="mx-auto h-6 w-6 text-gold" />
              <p className="mt-2">Start the conversation. Describe what to build.</p>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              onOpenFile={(path) => {
                setActiveFile(path);
                setTab("code");
              }}
            />
          ))}

          {streaming && (
            <BuildingCard
              reasoning={reasoningText}
              plan={livePlan}
              files={liveFiles}
              done={liveDone}
              hasStreamText={streamText.length > 0}
              model={modelLabel(settings.model)}
            />
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          <div className="rounded-xl border border-border/70 bg-card p-2 focus-within:border-gold/50">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Message JagX Dev…"
              rows={2}
              className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                {messages.length > 0 && !streaming && (
                  <button
                    onClick={regenerate}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <RefreshCw className="h-3 w-3" /> Regenerate
                  </button>
                )}
              </div>
              {streaming ? (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground"
                >
                  <Square className="h-3 w-3" /> Stop
                </button>
              ) : (
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-gold-gradient text-primary-foreground shadow-gold disabled:opacity-40"
                  aria-label="Send"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview / code pane */}
      <div
        className={`min-h-0 flex-1 flex-col bg-card/30 ${
          mobileView === "output" ? "flex" : "hidden"
        } lg:flex`}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
          <div className="inline-flex rounded-lg border border-border/70 bg-background p-0.5 text-xs">
            <button
              onClick={() => setTab("preview")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
                tab === "preview" ? "bg-gold-gradient text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Preview
            </button>
            <button
              onClick={() => setTab("code")}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 ${
                tab === "code" ? "bg-gold-gradient text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Code
            </button>
          </div>
          <span className="text-xs text-muted-foreground">
            {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : "No output yet"}
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          {files.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 gold-ring">
                  <Sparkles className="h-6 w-6 text-gold" />
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  Your live preview will appear here automatically as JagX writes files —
                  <br />
                  no need to press play.
                </p>
              </div>
            </div>
          ) : tab === "preview" ? (
            previewDoc ? (
              <iframe
                key={previewSignature}
                title="Preview"
                sandbox="allow-scripts allow-forms allow-modals allow-popups"
                srcDoc={previewDoc}
                className="h-full w-full border-0 bg-white"
              />
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
                These files don't run in a browser preview (e.g. a server or database project).
                Open the Code tab to see everything JagX wrote.
              </div>
            )
          ) : (
            <div className="grid h-full grid-cols-[200px_1fr] overflow-hidden">
              <div className="overflow-y-auto border-r border-border/60 py-2">
                {files.map((f) => (
                  <button
                    key={f.path}
                    onClick={() => setActiveFile(f.path)}
                    className={`flex w-full items-center gap-1.5 truncate px-3 py-1.5 text-left text-xs ${
                      selectedFile?.path === f.path
                        ? "bg-gold/10 text-gold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                    title={f.path}
                  >
                    <FileCode2 className="h-3.5 w-3.5 flex-none" />
                    <span className="truncate">{f.path}</span>
                  </button>
                ))}
              </div>
              <div className="flex min-w-0 flex-col overflow-hidden">
                {selectedFile && (
                  <>
                    <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
                      <span className="truncate font-mono text-[11px] text-muted-foreground">
                        {selectedFile.path}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedFile.content);
                          toast.success("Copied");
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto bg-background p-4 font-mono text-xs leading-relaxed">
                      <code>{selectedFile.content}</code>
                    </pre>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Live "JagX is building" card — shown while streaming, before the final
 * message lands. Mirrors the structure of a finished MessageBubble so there's
 * no visual jump when it's replaced. */
function BuildingCard({
  reasoning,
  plan,
  files,
  done,
  hasStreamText,
  model,
}: {
  reasoning: string;
  plan: string[];
  files: GeneratedFile[];
  done: string | null;
  hasStreamText: boolean;
  model: string;
}) {
  if (!hasStreamText && !reasoning) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-gold" />
        Thinking with {model}…
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-3 text-sm leading-relaxed">
      {reasoning && !plan.length && (
        <p className="whitespace-pre-wrap italic text-muted-foreground">{reasoning}</p>
      )}
      {plan.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-card/50 p-3">
          <p className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-gold" /> Plan
          </p>
          <ul className="space-y-1">
            {plan.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]">
                <ChevronRight className="mt-0.5 h-3 w-3 flex-none text-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f) => (
            <span
              key={f.path}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] text-muted-foreground"
            >
              <FileCode2 className="h-3 w-3 text-gold" />
              {f.path}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> writing…
          </span>
        </div>
      )}
      {done && <p className="whitespace-pre-wrap text-muted-foreground">{done}</p>}
    </div>
  );
}

function MessageBubble({
  role,
  content,
  onOpenFile,
}: {
  role: string;
  content: string;
  onOpenFile: (path: string) => void;
}) {
  if (role === "user") {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-gold-gradient px-4 py-2.5 text-sm text-primary-foreground shadow-gold">
        {content}
      </div>
    );
  }

  const plan = extractPlan(content);
  const files = extractGeneratedFiles(content);
  const done = extractDoneNote(content);
  const prose = stripStructuredMarkup(content);

  // Nothing structured recognized at all (a plain Q&A answer) — render as
  // markdown-ish text like before.
  if (plan.length === 0 && files.length === 0 && !done) {
    return (
      <div className="max-w-full text-sm leading-relaxed">
        <RichText text={content} />
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-3 text-sm leading-relaxed">
      {plan.length > 0 && (
        <div className="rounded-lg border border-border/60 bg-card/50 p-3">
          <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Plan</p>
          <ul className="space-y-1">
            {plan.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]">
                <ChevronRight className="mt-0.5 h-3 w-3 flex-none text-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {files.map((f) => (
            <button
              key={f.path}
              onClick={() => onOpenFile(f.path)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-gold/60 hover:text-foreground"
            >
              <Check className="h-3 w-3 text-gold" />
              <FileCode2 className="h-3 w-3" />
              {f.path}
              <span className="text-muted-foreground/60">
                {f.content.split("\n").length}L
              </span>
            </button>
          ))}
        </div>
      )}

      {prose && <RichText text={prose} />}

      {done && <p className="whitespace-pre-wrap text-muted-foreground">{done}</p>}
    </div>
  );
}

// Very light markdown-ish rendering: paragraphs + any remaining code fences
// (e.g. terminal commands with no file path attached).
function RichText({ text }: { text: string }) {
  const parts: { type: "text" | "code"; body: string; lang?: string }[] = [];
  const regex = /```(\w+)?\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", body: text.slice(last, m.index) });
    parts.push({ type: "code", body: m[2], lang: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", body: text.slice(last) });

  return (
    <div className="space-y-3">
      {parts.map((p, i) =>
        p.type === "code" ? (
          <div key={i} className="overflow-hidden rounded-lg border border-border/60 bg-background">
            <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{p.lang || "code"}</span>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
              <code>{p.body}</code>
            </pre>
          </div>
        ) : (
          p.body.trim() && (
            <p key={i} className="whitespace-pre-wrap">
              {p.body.trim()}
            </p>
          )
        ),
      )}
    </div>
  );
}
