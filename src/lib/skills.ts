import type { Skill } from "./storage";

export const BUILTIN_SKILLS: Skill[] = [
  {
    id: "builtin-web-app",
    name: "Web App Builder",
    description: "Build complete browser apps that can run in the preview.",
    instructions: `You are an expert web app builder. Produce a polished, working, multi-file implementation using the FILE protocol described in your system prompt (one fenced code block per file, path in the info string). Prefer a real component structure (index.html + styles + script, or React via ESM) over a single giant file. Use accessible semantic HTML, refined spacing, and production-quality interaction. No external assets that require auth.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-prd",
    name: "PRD Writer",
    description: "Write clear, structured product requirement documents.",
    instructions: `You write Product Requirement Documents. Structure: Problem, Users, Goals, Non-goals, User stories, Functional requirements, Non-functional requirements, Success metrics, Risks. Be concise and specific.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-seo",
    name: "SEO Auditor",
    description: "Analyze pages and suggest SEO improvements.",
    instructions: `You are an SEO expert. Analyze the given page/topic. Return: Title tag (< 60 chars), Meta description (< 160 chars), Primary keyword, Related keywords, H1 recommendation, Content gaps, Schema.org JSON-LD, and 3 improvement priorities.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-debug-py",
    name: "Debug Engineer",
    description: "Find root causes across frontend, backend, Python, and APIs.",
    instructions: `You are a senior debugging engineer. When given code, screenshots, logs, or an error, identify the likely root cause, explain it briefly, provide the smallest safe fix, and suggest a focused verification step. Cover edge cases without guessing.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-excel",
    name: "Data Analyst",
    description: "Analyze spreadsheets, CSVs, and datasets.",
    instructions: `You are a data analyst. When given data or a data question, provide: a summary of the data, key insights, suggested visualizations, and formulas or SQL to answer the question. Use markdown tables.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-fullstack",
    name: "Full-Stack Programmer",
    description: "Plan and write real multi-file apps, APIs, schemas, and deployment steps.",
    instructions: `You are a senior full-stack programmer. Design and implement frontend, backend, APIs, auth, databases, deployment files, tests, scripts, and architecture as separate real files (never one giant blob unless the user explicitly wants a single HTML snippet). For stacks that cannot run in a browser preview (servers, databases), still write every file completely and note what the user needs to run locally or deploy.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-ui-craft",
    name: "UI Craft",
    description: "Human-feeling product design instead of generic AI layouts.",
    instructions: `You are a product designer with strong taste. Avoid generic AI aesthetics, purple gradients, filler feature cards, and stock marketing copy. Make interfaces feel deliberate, usable, and human-made. Prioritize hierarchy, spacing, contrast, and real workflows over decoration.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-skill-maker",
    name: "Skill Maker",
    description: "Generate reusable instruction packs for future conversations.",
    instructions: `You create precise reusable skills. When asked to create a skill, return: Name, one-line Description, and Instructions. Instructions should be specific, operational, and short enough to reuse as a system prompt. Avoid vague traits and include exact output rules when needed.`,
    builtin: true,
    installed: true,
    createdAt: 0,
  },
  {
    id: "builtin-vercel",
    name: "Vercel Shipper",
    description: "Prepare projects for GitHub and Vercel deployment.",
    instructions: `You are a deployment engineer for Vercel and GitHub Actions. When deployment is requested, include required files, environment variables, build commands, routing config, and a concise checklist. Keep secrets out of source code.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
  {
    id: "builtin-code-review",
    name: "Code Reviewer",
    description: "Review code for correctness, security, and maintainability.",
    instructions: `You are a rigorous code reviewer. Prioritize correctness, security, data loss risks, accessibility, performance, and maintainability. Return findings by severity, then a compact patch or corrected snippet. Do not nitpick style unless it affects clarity or behavior.`,
    builtin: true,
    installed: false,
    createdAt: 0,
  },
];

// ---------------------------------------------------------------------------
// Agent protocol
//
// The model is asked to answer in three phases so the UI can show live,
// Claude-style status instead of a blank spinner:
//
//   1. `### Plan` — a short bullet list of what it's about to build.
//   2. One fenced code block per file, written as:
//        ```tsx src/App.tsx
//        ...file contents...
//        ```
//      (language tag, then a space, then the file path, on the same line
//      that opens the fence). Any number of files, any stack.
//   3. A closing note (optional) — how to run / what was built.
//
// A single ```html fenced block with no path is still supported for quick
// one-file sites, for backward compatibility with existing projects.
// ---------------------------------------------------------------------------

export const CORE_SYSTEM_PROMPT = `You are JagX Dev — an elite AI development agent built on NVIDIA models. You help users design, program, debug, and ship real software, and you work like a senior engineer pairing with the user, not a text completion engine.

Always answer in this order:
1. Start with a section titled exactly "### Plan" containing 3-6 short bullet points describing what you are about to build or change. Keep each bullet under 15 words. No fluff.
2. Then write the actual files. Every file goes in its own fenced code block, and the opening fence MUST include the language and the file path separated by a space, e.g.:
   \`\`\`tsx src/App.tsx
   ...
   \`\`\`
   \`\`\`css src/styles.css
   ...
   \`\`\`
   Use real, sensible file paths (src/, components/, api/, etc). Write complete file contents, not diffs or "// rest unchanged" placeholders.
3. If — and only if — the whole build is a single static page, you may instead use one \`\`\`html block with no path; the preview will render it directly.
4. After the files, add a short "### Done" note: one or two sentences on what you built and any setup step the user needs outside the browser (env vars, install commands). Skip this note for tiny tweaks.

Rules:
- Be concise in prose. Do not narrate obvious steps. Let the plan and files speak.
- Prefer multiple small, well-named files over one giant file, the way a real project is structured.
- For anything that can run standalone in a browser (HTML/CSS/JS, or React via ESM imports), make sure the file set is actually runnable together — an index.html that references the other files correctly, or a React entry that mounts to #root.
- For backend/server/database code that cannot run in a browser preview, still write every file completely and note what's needed to run it (this stays visible in the file tree even without a live preview).
- Never use TODO placeholders or omit logic you were asked for.
- When a Skill is active below, follow its instructions faithfully in addition to these rules.`;

export function buildSystemPrompt(installedSkills: Skill[]): string {
  const active = installedSkills.filter((s) => s.installed);
  if (active.length === 0) return CORE_SYSTEM_PROMPT;
  const skillBlock = active
    .map((s) => `## Skill: ${s.name}\n${s.instructions}`)
    .join("\n\n");
  return `${CORE_SYSTEM_PROMPT}\n\n---\n# Installed Skills\n\n${skillBlock}`;
}

export type GeneratedFile = {
  path: string;
  lang: string;
  content: string;
};

/** Legacy/simple case: one bare ```html block with no path. */
export function extractHtmlBlock(text: string): string | null {
  const match = text.match(/```html\s*\n([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

const FENCE_WITH_PATH = /```([a-zA-Z0-9_+-]+)[ \t]+([^\s`]+\.[a-zA-Z0-9]+)\s*\n([\s\S]*?)```/g;

/** Full multi-file extraction: every ```lang path/to/file fenced block. */
export function extractFiles(text: string): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(FENCE_WITH_PATH);
  while ((m = re.exec(text)) !== null) {
    const [, lang, path, content] = m;
    if (seen.has(path)) {
      // last write wins if the model repeats a path (e.g. during a revision)
      const idx = files.findIndex((f) => f.path === path);
      if (idx >= 0) files[idx] = { path, lang, content: content.trim() };
      continue;
    }
    seen.add(path);
    files.push({ path, lang, content: content.trim() });
  }
  return files;
}

/** Pull out the "### Plan" bullets so the UI can show them as live status. */
export function extractPlan(text: string): string[] {
  const match = text.match(/###\s*Plan\s*\n([\s\S]*?)(?=\n```|\n###|$)/i);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((l) => l.replace(/^[\s*-]+/, "").trim())
    .filter(Boolean);
}

/** Pull out the closing "### Done" note, if present. */
export function extractDoneNote(text: string): string | null {
  const match = text.match(/###\s*Done\s*\n([\s\S]*)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Full extraction with legacy fallback: prefers real `path` fenced files, and
 * if the model instead used the single bare ```html block (still allowed for
 * trivial one-page sites), synthesizes an `index.html` file from it so every
 * downstream consumer (preview, file tree, storage) only has one shape to
 * deal with.
 */
export function extractGeneratedFiles(text: string): GeneratedFile[] {
  const files = extractFiles(text);
  if (files.length > 0) return files;
  const html = extractHtmlBlock(text);
  if (html) return [{ path: "index.html", lang: "html", content: html }];
  return [];
}

/** Strip the Plan/Done markers and file fences out of a response, leaving
 * only free-form prose (questions, caveats, non-file explanations). */
export function stripStructuredMarkup(text: string): string {
  let out = text;
  out = out.replace(/###\s*Plan\s*\n[\s\S]*?(?=\n```|\n###|$)/i, "");
  out = out.replace(new RegExp(FENCE_WITH_PATH), "");
  out = out.replace(/```html\s*\n[\s\S]*?```/i, "");
  out = out.replace(/###\s*Done\s*\n[\s\S]*$/i, "");
  return out.trim();
}

const REACT_EXT = /\.(tsx|jsx)$/i;
const CSS_EXT = /\.css$/i;

/**
 * Assemble a single runnable HTML document from a multi-file project so it
 * can be dropped straight into a sandboxed iframe — no bundler, no backend.
 *
 * - If the files include an index.html, use it as the shell and inline any
 *   local <link rel="stylesheet"> / <script src> files referenced from it.
 * - Otherwise, if there's a React entry (tsx/jsx), build a shell that loads
 *   React + ReactDOM + Babel standalone from a CDN, transpiles every
 *   tsx/jsx file in-browser, and mounts the app — a lightweight
 *   WebContainer-style trick with zero build step.
 * - Otherwise, fall back to concatenating any plain .css/.js files under a
 *   minimal HTML shell.
 */
export function buildPreviewDocument(files: GeneratedFile[]): string | null {
  if (files.length === 0) return null;

  const byPath = new Map(files.map((f) => [f.path.replace(/^\.?\//, ""), f]));
  const indexHtml = byPath.get("index.html") ?? files.find((f) => /index\.html$/i.test(f.path));

  if (indexHtml) {
    let html = indexHtml.content;
    html = html.replace(
      /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
      (whole, href) => {
        const file = byPath.get(href.replace(/^\.?\//, ""));
        return file ? `<style>\n${file.content}\n</style>` : whole;
      },
    );
    html = html.replace(
      /<script[^>]+src=["']([^"']+)["'][^>]*><\/script>/gi,
      (whole, src) => {
        const file = byPath.get(src.replace(/^\.?\//, ""));
        if (!file) return whole;
        const isModule = REACT_EXT.test(file.path) || /type=["']module["']/i.test(whole);
        return `<script type="${isModule ? "text/babel" : "text/javascript"}" data-type="module">\n${file.content}\n</script>`;
      },
    );
    if (files.some((f) => REACT_EXT.test(f.path)) && !/babel/i.test(html)) {
      html = html.replace(
        "</head>",
        `<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script></head>`,
      );
    }
    return html;
  }

  const reactFiles = files.filter((f) => REACT_EXT.test(f.path));
  if (reactFiles.length > 0) {
    const cssFiles = files.filter((f) => CSS_EXT.test(f.path));
    const entry =
      reactFiles.find((f) => /(^|\/)(app|main|index)\.(t|j)sx$/i.test(f.path)) ?? reactFiles[0];
    const others = reactFiles.filter((f) => f.path !== entry.path);

    const modules = [...others, entry]
      .map(
        (f) =>
          `<script type="text/babel" data-presets="typescript,react" data-filename="${f.path}">\n${f.content}\n</script>`,
      )
      .join("\n");

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Preview</title>
<script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<style>
  html,body,#root{height:100%;margin:0;}
  body{font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;}
  ${cssFiles.map((f) => f.content).join("\n")}
</style>
</head>
<body>
<div id="root"></div>
${modules}
<script type="text/babel" data-presets="typescript,react">
try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  const Entry = typeof App !== 'undefined' ? App : (typeof Main !== 'undefined' ? Main : null);
  if (Entry) root.render(<Entry />);
} catch (e) {
  document.getElementById('root').innerHTML = '<pre style="color:#dc2626;padding:16px;white-space:pre-wrap">' + (e && e.message ? e.message : e) + '</pre>';
}
</script>
</body>
</html>`;
  }

  const cssFiles = files.filter((f) => CSS_EXT.test(f.path));
  const jsFiles = files.filter((f) => /\.js$/i.test(f.path));
  if (cssFiles.length || jsFiles.length) {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><style>${cssFiles.map((f) => f.content).join("\n")}</style></head>
<body>
<div id="app"></div>
<script>${jsFiles.map((f) => f.content).join("\n;\n")}</script>
</body></html>`;
  }

  return null;
}
