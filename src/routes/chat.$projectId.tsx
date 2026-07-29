import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Download,
  Eye,
  FileCode2,
  Folder,
  History,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Paperclip,
  Play,
  RefreshCw,
  Rocket,
  Share2,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import {
  K,
  lsGet,
  lsSet,
  uid,
  DEFAULT_SETTINGS,
  getSettings,
  type ChatMessage,
  type Project,
  type Settings,
  type Skill,
  type BackendConfig,
  DEFAULT_BACKEND_CONFIG,
  type ProjectVersion,
} from "../lib/storage";
import {
  modelLabel,
  nvidiaChat,
  isModelLocked,
  FREE_MAX_TOKENS,
  PRO_MAX_TOKENS,
  FREE_MAX_ACTIVE_SKILLS,
  NVIDIA_MODELS,
} from "../lib/nvidia";
import { checkPro } from "../lib/license";
import {
  buildSystemPrompt,
  buildPreviewDocument,
  extractDoneNote,
  extractGeneratedFiles,
  extractPlan,
  extractEnvVarRequests,
  stripStructuredMarkup,
  BUILTIN_SKILLS,
  type GeneratedFile,
  type EnvVarRequest,
} from "../lib/skills";

export const Route = createFileRoute("/chat/$projectId")({
  component: () => (
    <ChatErrorBoundary>
      <ChatPage />
    </ChatErrorBoundary>
  ),
});

/** Last line of defense: if anything in this page throws during render
 * (a bad file, a parsing edge case we didn't anticipate), show a
 * recoverable message here instead of taking down the whole app. Nothing
 * is lost — chats and files are persisted to localStorage as they happen,
 * so "Try again" just re-mounts against that same data. */
class ChatErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("Chat page crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-lg font-semibold">This chat hit a snag</h1>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Something broke the page itself, not just the preview. Your chat and files are saved —
              try again to pick back up right where you left off.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:border-gold/60"
            >
              Try again
            </button>
            <Link
              to="/"
              className="rounded-md bg-gold-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-gold"
            >
              Go home
            </Link>
          </div>
          <pre className="mt-2 max-w-lg overflow-auto rounded-md border border-border/60 bg-card/50 p-3 text-left text-[11px] text-muted-foreground">
            {String(this.state.error.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}


type Attachment = {
  id: string;
  name: string;
  kind: "text" | "image" | "binary";
  content?: string; // for text/code files
  dataUrl?: string; // for images
  size: number;
};

const TEXT_EXTENSIONS = new Set([
  "html", "htm", "css", "js", "jsx", "ts", "tsx", "json", "md", "txt", "svg",
  "yml", "yaml", "py", "java", "c", "cpp", "cs", "go", "rb", "php", "sql",
  "env", "gitignore", "toml", "xml", "sh",
]);

function extOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function langForExt(ext: string) {
  const map: Record<string, string> = {
    html: "html", htm: "html", css: "css", js: "javascript", jsx: "jsx",
    ts: "typescript", tsx: "tsx", json: "json", md: "markdown", py: "python",
    svg: "svg",
  };
  return map[ext] ?? "text";
}

function mergeGeneratedFiles(existing: GeneratedFile[], incoming: GeneratedFile[]): GeneratedFile[] {
  const byPath = new Map(existing.map((f) => [f.path, f]));
  for (const f of incoming) byPath.set(f.path, f);
  return Array.from(byPath.values());
}

type TreeNode = {
  name: string;
  path: string;
  isFile: boolean;
  children?: TreeNode[];
};

function buildFileTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const f of files) {
    const parts = f.path.split("/").filter(Boolean);
    let level = root;
    let currentPath = "";
    parts.forEach((part, i) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = i === parts.length - 1;
      let node = level.find((n) => n.name === part && n.isFile === isLast);
      if (!node) {
        node = { name: part, path: currentPath, isFile: isLast, children: isLast ? undefined : [] };
        level.push(node);
      }
      if (!isLast) level = node.children!;
    });
  }
  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.isFile !== b.isFile ? (a.isFile ? 1 : -1) : a.name.localeCompare(b.name)));
    nodes.forEach((n) => n.children && sortTree(n.children));
  };
  sortTree(root);
  return root;
}

function VersionHistoryPanel({
  projectId,
  onRestore,
  onClose,
}: {
  projectId: string;
  onRestore: (version: ProjectVersion) => void;
  onClose: () => void;
}) {
  const versions = lsGet<ProjectVersion[]>(K.versions(projectId), []);

  return (
    <div className="absolute right-0 top-full z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-md border border-border/70 bg-card shadow-elegant">
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
        <span className="text-xs font-semibold">Version history</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {versions.length === 0 ? (
        <p className="p-3 text-xs text-muted-foreground">
          No versions yet — one is saved automatically each time JagX finishes a build.
        </p>
      ) : (
        versions.map((v) => (
          <button
            key={v.id}
            onClick={() => onRestore(v)}
            className="flex w-full flex-col items-start gap-0.5 border-b border-border/40 px-3 py-2 text-left hover:bg-accent"
          >
            <span className="truncate text-xs font-medium">{v.label}</span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(v.createdAt).toLocaleString()} · {v.files.length} file{v.files.length === 1 ? "" : "s"}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

function FileTreeView({
  files,
  selectedPath,
  onSelect,
}: {
  files: GeneratedFile[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const tree = useMemo(() => buildFileTree(files), [files]);
  return (
    <div className="py-2">
      {tree.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} selectedPath={selectedPath} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const indent = { paddingLeft: `${depth * 14 + 10}px` };

  if (node.isFile) {
    return (
      <button
        onClick={() => onSelect(node.path)}
        className={`flex w-full items-center gap-1.5 truncate py-1.5 pr-2 text-left text-xs ${
          selectedPath === node.path
            ? "bg-gold/10 text-gold"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
        style={indent}
        title={node.path}
      >
        <FileCode2 className="h-3.5 w-3.5 flex-none" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 py-1.5 pr-2 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        style={indent}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 flex-none" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-none" />
        )}
        <Folder className="h-3.5 w-3.5 flex-none" />
        <span className="truncate">{node.name}</span>
      </button>
      {open &&
        node.children?.map((child) => (
          <FileTreeNode key={child.path} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
        ))}
    </div>
  );
}

function ChatPage() {
  const { projectId } = Route.useParams();
  const navigate = useNavigate();

  const [hydrated, setHydrated] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [reasoningText, setReasoningText] = useState("");
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [mobileView, setMobileView] = useState<"chat" | "output">("chat");
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showModelSwitch, setShowModelSwitch] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(DEFAULT_BACKEND_CONFIG);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate
  useEffect(() => {
    const projects = lsGet<Project[]>(K.projects, []);
    const p = projects.find((x) => x.id === projectId) ?? null;
    setProject(p);
    setSettings(getSettings());
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
    checkPro().then(setIsPro);
    setBackendConfig(lsGet<BackendConfig>(K.backend(projectId), DEFAULT_BACKEND_CONFIG));

    // Autorun if the seed message was queued from home
    const pending = raw.some((m) => m && m.__pending);
    if (pending && clean.length > 0 && clean[clean.length - 1].role === "user") {
      lsSet(K.messages(projectId), clean);
      setTimeout(() => runAssistant(clean, savedSkills, getSettings()), 50);
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

    const proNow = await checkPro();
    setIsPro(proNow);

    let model = s.model;
    if (isModelLocked(model, proNow)) {
      toast("That model needs Pro — using a free model instead this time.", {
        action: { label: "Upgrade", onClick: () => navigate({ to: "/upgrade" }) },
      });
      model = DEFAULT_SETTINGS.model;
    }
    const maxTokens = Math.min(s.maxTokens, proNow ? PRO_MAX_TOKENS : FREE_MAX_TOKENS);

    let effectiveSkills = skillList;
    if (!proNow) {
      const active = skillList.filter((sk) => sk.installed);
      if (active.length > FREE_MAX_ACTIVE_SKILLS) {
        const keepIds = new Set(active.slice(0, FREE_MAX_ACTIVE_SKILLS).map((sk) => sk.id));
        effectiveSkills = skillList.map((sk) =>
          sk.installed && !keepIds.has(sk.id) ? { ...sk, installed: false } : sk,
        );
        toast(`Free plan uses your first ${FREE_MAX_ACTIVE_SKILLS} active skills this turn.`, {
          action: { label: "Upgrade", onClick: () => navigate({ to: "/upgrade" }) },
        });
      }
    }

    setStreaming(true);
    setStreamText("");
    setReasoningText("");
    setTab("preview");
    if (s.autoPreview) setMobileView("output");
    const ac = new AbortController();
    abortRef.current = ac;

    const envVarKeys = lsGet<{ key: string }[]>(K.envVars(projectId), [])
      .map((v) => v.key)
      .filter(Boolean);
    const systemPrompt = buildSystemPrompt(effectiveSkills, {
      askBeforeBuilding: s.askBeforeBuilding,
      envVarKeys,
      backendBaseUrl: backendConfig.baseUrl || undefined,
    });
    const apiMessages = [
      { role: "system" as const, content: systemPrompt },
      ...base.map((m) => ({ role: m.role, content: m.content })),
    ];

    let lastFileSignature = "";

    try {
      let acc = "";
      const full = await nvidiaChat({
        apiKey: s.nvidiaApiKey,
        model,
        messages: apiMessages,
        temperature: s.temperature,
        maxTokens,
        signal: ac.signal,
        onReasoning: (chunk) => setReasoningText((r) => r + chunk),
        onToken: (chunk) => {
          acc += chunk;
          setStreamText(acc);

          // Update the live file set (and the preview) the moment each file's
          // fence closes — this is what makes the build feel like it's
          // happening in front of you instead of appearing all at once.
          // Merged against the project's files as they were when this turn
          // started, so a response that only touches one file doesn't wipe
          // out the rest of a multi-file project.
          const liveFiles = extractGeneratedFiles(acc);
          const signature = liveFiles.map((f) => `${f.path}:${f.content.length}`).join("|");
          if (liveFiles.length && signature !== lastFileSignature) {
            lastFileSignature = signature;
            persistFiles(mergeGeneratedFiles(files, liveFiles));
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
        const merged = mergeGeneratedFiles(files, finalFiles);
        persistFiles(merged);
        saveVersion(merged, extractPlan(full)[0] || finalFiles[0]?.path || "Build");
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

  function readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ""));
      r.onerror = () => reject(r.error);
      r.readAsText(file);
    });
  }

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result ?? ""));
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
  }

  function saveVersion(snapshotFiles: GeneratedFile[], label: string) {
    const versions = lsGet<ProjectVersion[]>(K.versions(projectId), []);
    const entry: ProjectVersion = {
      id: uid(),
      createdAt: Date.now(),
      label: (label || "Build").slice(0, 80),
      files: snapshotFiles,
    };
    // Keep the most recent 30 — plenty for rollback, without letting
    // localStorage grow unbounded on long-running projects.
    lsSet(K.versions(projectId), [entry, ...versions].slice(0, 30));
  }

  function restoreVersion(version: ProjectVersion) {
    persistFiles(version.files);
    saveVersion(version.files, `Restored: ${version.label}`);
    setShowHistory(false);
    toast.success(`Restored "${version.label}"`);
  }

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const incoming: Attachment[] = [];
    const newProjectFiles: GeneratedFile[] = [];

    for (const file of Array.from(fileList)) {
      const ext = extOf(file.name);
      try {
        if (ext === "zip") {
          const fflate = await import(/* @vite-ignore */ "https://esm.sh/fflate@0.8.2");
          const buf = new Uint8Array(await file.arrayBuffer());
          const unzipped: Record<string, Uint8Array> = await new Promise((resolve, reject) => {
            fflate.unzip(buf, (err: any, data: any) => (err ? reject(err) : resolve(data)));
          });
          const decoder = new TextDecoder();
          for (const [path, bytes] of Object.entries(unzipped)) {
            if (path.endsWith("/") || path.includes("__MACOSX") || path.startsWith(".")) continue;
            const e = extOf(path);
            if (TEXT_EXTENSIONS.has(e)) {
              const content = decoder.decode(bytes);
              newProjectFiles.push({ path, lang: langForExt(e), content });
            }
          }
          incoming.push({
            id: uid(),
            name: file.name,
            kind: "binary",
            size: file.size,
          });
        } else if (TEXT_EXTENSIONS.has(ext) || file.type.startsWith("text/")) {
          const content = await readAsText(file);
          incoming.push({ id: uid(), name: file.name, kind: "text", content, size: file.size });
          newProjectFiles.push({ path: file.name, lang: langForExt(ext), content });
        } else if (file.type.startsWith("image/")) {
          const dataUrl = await readAsDataUrl(file);
          incoming.push({ id: uid(), name: file.name, kind: "image", dataUrl, size: file.size });
        } else {
          incoming.push({ id: uid(), name: file.name, kind: "binary", size: file.size });
        }
      } catch {
        toast.error(`Couldn't read ${file.name}`);
      }
    }

    setAttachments((prev) => [...prev, ...incoming]);
    // Show uploaded project files immediately — "read it, preview it as-is."
    if (newProjectFiles.length > 0) {
      persistFiles(mergeGeneratedFiles(files, newProjectFiles));
      setTab(newProjectFiles.some((f) => f.path === "index.html") ? "preview" : "code");
      toast.success(`Added ${newProjectFiles.length} file${newProjectFiles.length === 1 ? "" : "s"} to the project`);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function downloadProjectZip() {
    if (files.length === 0) return;
    setDownloadingZip(true);
    try {
      const fflate = await import(/* @vite-ignore */ "https://esm.sh/fflate@0.8.2");
      const encoder = new TextEncoder();
      const zipInput: Record<string, Uint8Array> = {};
      for (const f of files) {
        zipInput[f.path] = encoder.encode(f.content);
      }
      const zipped: Uint8Array = await new Promise((resolve, reject) => {
        fflate.zip(zipInput, { level: 6 }, (err: any, data: Uint8Array) =>
          err ? reject(err) : resolve(data),
        );
      });
      const blob = new Blob([zipped], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(project?.name || "jagx-project").replace(/[^a-z0-9-_]+/gi, "-")}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.success(`Downloaded ${files.length} file${files.length === 1 ? "" : "s"}`);
    } catch (err: any) {
      toast.error(err?.message || "Couldn't build the zip");
    } finally {
      setDownloadingZip(false);
    }
  }

  async function shareProject() {
    if (files.length === 0) return;
    setSharing(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName: project?.name || "Untitled", files }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const data = JSON.parse(text);
      const link = `${window.location.origin}/share/${data.slug}`;
      await navigator.clipboard.writeText(link).catch(() => {});
      toast.success("Share link copied to clipboard", { description: link });
    } catch (err: any) {
      toast.error(err.message || "Couldn't create a share link");
    } finally {
      setSharing(false);
    }
  }

  async function deployToVercel() {
    if (files.length === 0) return;
    if (!settings.vercelToken) {
      toast.error("Add your Vercel token in Settings first.", {
        action: { label: "Settings", onClick: () => navigate({ to: "/settings" }) },
      });
      return;
    }
    setDeploying(true);
    try {
      const res = await fetch("/api/vercel-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: settings.vercelToken,
          projectName: project?.name || "jagx-project",
          files,
        }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text);
      const data = JSON.parse(text);
      toast.success("Deployed to Vercel", {
        description: data.url,
        action: { label: "Open", onClick: () => window.open(data.url, "_blank") },
      });
    } catch (err: any) {
      toast.error(err.message || "Deploy failed");
    } finally {
      setDeploying(false);
    }
  }

  function send() {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (streaming) return;

    let content = text;
    for (const a of attachments) {
      if (a.kind === "text" && a.content != null) {
        content += `\n\n\`\`\`${langForExt(extOf(a.name))} ${a.name}\n${a.content}\n\`\`\``;
      } else if (a.kind === "image" && a.dataUrl) {
        content += `\n\n![${a.name}](${a.dataUrl})`;
      } else {
        content += `\n\n(Attached: ${a.name}, ${Math.round(a.size / 1024)}KB — already added to project files.)`;
      }
    }
    if (!text && attachments.length > 0) {
      content = `Here are the files I'm uploading — take a look and tell me what you see, or continue from them.${content}`;
    }

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content,
      createdAt: Date.now(),
    };
    const next = [...messages, userMsg];
    persistMessages(next);
    setInput("");
    setAttachments([]);
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

  const previewDoc = useMemo(() => {
    try {
      return buildPreviewDocument(files, backendConfig.baseUrl ? backendConfig : undefined);
    } catch (err: any) {
      console.error("buildPreviewDocument failed", err);
      return null;
    }
  }, [files, backendConfig]);
  const previewSignature = useMemo(
    () => files.map((f) => `${f.path}:${f.content.length}`).join("|"),
    [files],
  );
  const selectedFile = useMemo(
    () => files.find((f) => f.path === activeFile) ?? files[0] ?? null,
    [files, activeFile],
  );

  const [previewError, setPreviewError] = useState<{ title: string; detail: string } | null>(null);

  useEffect(() => {
    setPreviewError(null);
  }, [previewSignature]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data;
      if (data && data.source === "jagx-preview" && data.type === "error") {
        setPreviewError({ title: data.title || "Preview error", detail: data.detail || "" });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  function askToFixPreviewError() {
    if (!previewError || streaming) return;
    const text = `The preview is showing this error — please fix it:\n\n${previewError.title}${
      previewError.detail ? `\n${previewError.detail}` : ""
    }`;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: text, createdAt: Date.now() };
    const next = [...messages, userMsg];
    persistMessages(next);
    setPreviewError(null);
    runAssistant(next, skills, settings);
  }

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
          <div className="relative flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {activeSkills.length} skill{activeSkills.length === 1 ? "" : "s"} ·
            </span>
            <button
              onClick={() => setShowModelSwitch((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              {modelLabel(settings.model)}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            {showModelSwitch && (
              <div className="absolute right-0 top-full z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-md border border-border/70 bg-card shadow-elegant">
                {NVIDIA_MODELS.map((m) => {
                  const locked = m.tier === "pro" && !isPro;
                  const active = settings.model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (locked) {
                          toast("That model needs Pro", {
                            action: { label: "Upgrade", onClick: () => navigate({ to: "/upgrade" }) },
                          });
                          return;
                        }
                        const next = { ...settings, model: m.id };
                        setSettings(next);
                        lsSet(K.settings, next);
                        setShowModelSwitch(false);
                      }}
                      className={`flex w-full items-center justify-between gap-2 border-b border-border/40 px-3 py-2 text-left text-xs ${
                        active ? "bg-gold/10 text-gold" : locked ? "opacity-50" : "hover:bg-accent"
                      }`}
                    >
                      <span className="truncate">{m.label}</span>
                      {m.tier === "pro" && (
                        <span className="flex-none rounded-full border border-gold/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-gold">
                          Pro
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
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
              projectId={projectId}
              onOpenFile={(path) => {
                setActiveFile(path);
                setTab("code");
              }}
            />
          ))}

          {streaming && (
            <BuildingCard
              reasoning={settings.showReasoning ? reasoningText : ""}
              plan={livePlan}
              files={liveFiles}
              done={liveDone}
              hasStreamText={streamText.length > 0}
              model={modelLabel(settings.model)}
            />
          )}
        </div>

        <div className="border-t border-border/60 p-3">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {attachments.map((a) => (
                <span
                  key={a.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {a.kind === "image" ? (
                    <ImageIcon className="h-3 w-3 text-gold" />
                  ) : (
                    <Paperclip className="h-3 w-3 text-gold" />
                  )}
                  <span className="max-w-[140px] truncate">{a.name}</span>
                  <button
                    onClick={() => removeAttachment(a.id)}
                    className="text-muted-foreground/60 hover:text-destructive"
                    aria-label={`Remove ${a.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
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
              placeholder="Message JagX Dev… or attach files below"
              rows={2}
              className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Attach files, images, or a .zip of a project"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                </button>
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
                  disabled={!input.trim() && attachments.length === 0}
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
          <div className="relative flex items-center gap-2">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-gold/60 hover:text-foreground"
              title="Version history"
            >
              <History className="h-3.5 w-3.5" />
            </button>
            {showHistory && <VersionHistoryPanel projectId={projectId} onRestore={restoreVersion} onClose={() => setShowHistory(false)} />}
            {files.length > 0 && (
              <div>
                <button
                  onClick={() => setShowActions((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-gold/60 hover:text-foreground"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  Export
                </button>
                {showActions && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-border/70 bg-card shadow-elegant">
                    <button
                      onClick={() => {
                        setShowActions(false);
                        downloadProjectZip();
                      }}
                      disabled={downloadingZip}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent disabled:opacity-50"
                    >
                      {downloadingZip ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      Download .zip
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false);
                        shareProject();
                      }}
                      disabled={sharing}
                      className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2 text-left text-xs hover:bg-accent disabled:opacity-50"
                    >
                      {sharing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Share2 className="h-3.5 w-3.5" />
                      )}
                      Copy share link
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false);
                        deployToVercel();
                      }}
                      disabled={deploying}
                      className="flex w-full items-center gap-2 border-t border-border/60 px-3 py-2 text-left text-xs hover:bg-accent disabled:opacity-50"
                    >
                      {deploying ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Rocket className="h-3.5 w-3.5" />
                      )}
                      Deploy to Vercel
                    </button>
                  </div>
                )}
              </div>
            )}
            <span className="text-xs text-muted-foreground">
              {files.length ? `${files.length} file${files.length === 1 ? "" : "s"}` : "No output yet"}
            </span>
          </div>
        </div>

        {previewError && tab === "preview" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-3.5 w-3.5 flex-none" />
            <span className="flex-1 truncate">{previewError.title}</span>
            <button
              onClick={askToFixPreviewError}
              disabled={streaming}
              className="inline-flex items-center gap-1 rounded-md bg-destructive px-2 py-1 font-semibold text-destructive-foreground disabled:opacity-50"
            >
              Ask JagX to fix it
            </button>
            <button
              onClick={() => setPreviewError(null)}
              className="text-destructive/70 hover:text-destructive"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
              <div className="overflow-y-auto border-r border-border/60">
                <FileTreeView
                  files={files}
                  selectedPath={selectedFile?.path ?? null}
                  onSelect={setActiveFile}
                />
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
      {done && <div className="text-muted-foreground"><RichText text={done} /></div>}
    </div>
  );
}

function MessageBubble({
  role,
  content,
  projectId,
  onOpenFile,
}: {
  role: string;
  content: string;
  projectId: string;
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
  const envRequests = extractEnvVarRequests(content);

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

      {done && <div className="text-muted-foreground"><RichText text={done} /></div>}

      {envRequests.length > 0 && <CredentialsRequestCard projectId={projectId} requests={envRequests} />}
    </div>
  );
}

/** Inline "please provide these securely" form — appears whenever the model
 * asks for real credentials (a database URL, an API key, a Supabase anon
 * key...) that aren't already tracked for this project. Saves straight into
 * the same per-project env vars Settings uses, so the AI can reference them
 * by name on the next turn without the user leaving the chat. */
function CredentialsRequestCard({
  projectId,
  requests,
}: {
  projectId: string;
  requests: EnvVarRequest[];
}) {
  const [existingKeys, setExistingKeys] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = lsGet<{ key: string }[]>(K.envVars(projectId), []);
    setExistingKeys(new Set(existing.map((e) => e.key)));
  }, [projectId]);

  const pending = requests.filter((r) => !existingKeys.has(r.key));
  if (pending.length === 0) return null;

  function save() {
    const existing = lsGet<
      { id: string; key: string; value: string; scope: "server" | "client" }[]
    >(K.envVars(projectId), []);
    const next = [...existing];
    for (const r of pending) {
      const value = (values[r.key] || "").trim();
      if (!value) continue;
      next.push({ id: uid(), key: r.key, value, scope: r.scope });
    }
    lsSet(K.envVars(projectId), next);
    setSaved(true);
    toast.success("Saved — JagX will use these by name in the next build.");
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 p-3 text-xs text-gold">
        <Check className="h-4 w-4 flex-none" />
        Credentials saved for this project.
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-gold/40 bg-card/60 p-3">
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-gold">
        <KeyRound className="h-3.5 w-3.5" /> This build needs some credentials
      </p>
      {pending.map((r) => (
        <div key={r.key}>
          <label className="flex items-center gap-1.5 text-xs font-medium">
            <span className="font-mono">{r.key}</span>
            <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[9px] uppercase text-muted-foreground">
              {r.scope}
            </span>
          </label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{r.description}</p>
          <input
            type="password"
            value={values[r.key] || ""}
            onChange={(e) => setValues((v) => ({ ...v, [r.key]: e.target.value }))}
            placeholder="Paste the value here"
            className="mt-1 w-full rounded-md border border-border bg-background px-2.5 py-1.5 font-mono text-xs outline-none focus:border-gold/60"
          />
        </div>
      ))}
      <button
        onClick={save}
        className="mt-1 w-full rounded-md bg-gold-gradient px-3 py-2 text-xs font-semibold text-primary-foreground shadow-gold"
      >
        Save securely for this project
      </button>
      <p className="text-[10px] text-muted-foreground">
        Stored on this device only, in Settings → Environment variables — never sent to the AI model.
      </p>
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
