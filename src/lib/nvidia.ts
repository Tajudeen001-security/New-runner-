// NVIDIA NIM API client.
// Browser calls go through our TanStack server route so NVIDIA's CORS policy
// does not break user-supplied keys in production.

export type ModelSpeed = "fast" | "balanced" | "deep";

export type NvidiaModel = {
  id: string;
  label: string;
  hint: string;
  family: string;
  speed: ModelSpeed;
  /** Small badge shown next to the name in Settings (e.g. "Flagship"). */
  badge?: string;
  /** Approximate context window, shown as a hint in Settings. */
  context?: string;
};

// NVIDIA's model catalog on build.nvidia.com changes over time — slugs get
// renamed or retired. These are known-good as of mid-2026; if one ever
// 404s, Settings → "Custom NVIDIA model ID" lets a user paste the current
// slug straight from build.nvidia.com/models without waiting on an app update.
export const NVIDIA_MODELS: NvidiaModel[] = [
  // --- NVIDIA Nemotron 3 (current generation) ---
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b",
    label: "Nemotron 3 Ultra",
    hint: "NVIDIA's flagship — hybrid Mamba-Transformer MoE for the hardest builds",
    family: "NVIDIA",
    speed: "deep",
    badge: "Flagship",
    context: "1M tokens",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b",
    label: "Nemotron 3 Super",
    hint: "High-efficiency NVIDIA reasoning model — great default for full apps",
    family: "NVIDIA",
    speed: "balanced",
    badge: "Recommended",
    context: "1M tokens",
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b",
    label: "Nemotron 3 Nano",
    hint: "Small and very fast — quick edits and tight iteration loops",
    family: "NVIDIA",
    speed: "fast",
    context: "256K tokens",
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning",
    label: "Nemotron 3 Nano Omni",
    hint: "Multimodal — reasons over text, image, video, and audio in one pass",
    family: "NVIDIA",
    speed: "balanced",
    context: "256K tokens",
  },
  {
    id: "nvidia/nemotron-nano-12b-v2-vl",
    label: "Nemotron Nano 12B VL",
    hint: "Vision-language — reads screenshots, docs, and charts you attach",
    family: "NVIDIA",
    speed: "balanced",
    context: "128K tokens",
  },
  // --- NVIDIA Nemotron (previous generation, still solid) ---
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1.5",
    label: "Nemotron Super 49B v1.5",
    hint: "Efficient previous-gen NVIDIA reasoning model",
    family: "NVIDIA",
    speed: "balanced",
    context: "128K tokens",
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1",
    label: "Nemotron Super 49B",
    hint: "Reliable reasoning/tool-calling model derived from Llama 3.3 70B",
    family: "NVIDIA",
    speed: "balanced",
    context: "128K tokens",
  },
  {
    id: "nvidia/llama-3.1-nemotron-70b-instruct",
    label: "Nemotron 70B",
    hint: "Tuned for helpfulness and precise, well-aligned answers",
    family: "NVIDIA",
    speed: "balanced",
    context: "128K tokens",
  },
  {
    id: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    label: "Nemotron Ultra 253B",
    hint: "Previous-gen NVIDIA flagship reasoning model",
    family: "NVIDIA",
    speed: "deep",
    context: "128K tokens",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2",
    label: "Nemotron Nano 9B",
    hint: "Small, controllable reasoning toggle — fast day-to-day driver",
    family: "NVIDIA",
    speed: "fast",
    context: "128K tokens",
  },
  {
    id: "nvidia/llama-3.1-nemotron-nano-8b-v1",
    label: "Nemotron Nano 8B",
    hint: "Tiny and quick — single-GPU friendly, good for snappy iteration",
    family: "NVIDIA",
    speed: "fast",
    context: "128K tokens",
  },
  {
    id: "nvidia/nemotron-4-340b-instruct",
    label: "Nemotron-4 340B",
    hint: "Large chat model, strong for synthetic data and structured text",
    family: "NVIDIA",
    speed: "deep",
    context: "4K tokens",
  },
  // --- Coding specialists ---
  {
    id: "qwen/qwen3-coder-480b-a35b-instruct",
    label: "Qwen3 Coder 480B",
    hint: "Large coding specialist, built for multi-file work",
    family: "Qwen",
    speed: "deep",
    context: "256K tokens",
  },
  {
    id: "qwen/qwen2.5-coder-32b-instruct",
    label: "Qwen 2.5 Coder 32B",
    hint: "Fast coding and debugging fallback",
    family: "Qwen",
    speed: "fast",
    context: "32K tokens",
  },
  {
    id: "moonshotai/kimi-k2.6",
    label: "Kimi K2.6",
    hint: "1T-parameter MoE — strong agentic coding and long-context planning",
    family: "Moonshot AI",
    speed: "balanced",
    context: "256K tokens",
  },
  {
    id: "z-ai/glm-5.2",
    label: "GLM 5.2",
    hint: "Agentic workflows, coding, and long-horizon tasks",
    family: "Z.ai",
    speed: "balanced",
    context: "200K tokens",
  },
  {
    id: "poolside/laguna-xs-2.1",
    label: "Laguna XS 2.1",
    hint: "Efficient 33B MoE tuned for long-horizon agentic coding",
    family: "Poolside",
    speed: "fast",
    context: "128K tokens",
  },
  {
    id: "qwen/qwq-32b",
    label: "QwQ 32B",
    hint: "Explicit chain-of-thought — good for tricky logic and math-heavy code",
    family: "Qwen",
    speed: "deep",
    context: "32K tokens",
  },
  // --- Reasoning / general MoE ---
  {
    id: "deepseek-ai/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    hint: "284B MoE tuned for fast coding and agentic tool use",
    family: "DeepSeek",
    speed: "balanced",
    context: "1M tokens",
  },
  {
    id: "minimaxai/minimax-m3",
    label: "MiniMax M3",
    hint: "Multimodal MoE with strong reasoning, coding, and tool-calling",
    family: "MiniMax",
    speed: "deep",
    context: "1M tokens",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    hint: "Open-weight general model, solid all-rounder for chat and code",
    family: "OpenAI (open)",
    speed: "deep",
    context: "128K tokens",
  },
  // --- General purpose ---
  {
    id: "meta/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B",
    hint: "Reliable general-purpose chat and coding",
    family: "Meta",
    speed: "balanced",
    context: "128K tokens",
  },
  {
    id: "meta/llama-3.1-405b-instruct",
    label: "Llama 3.1 405B",
    hint: "Meta's largest — deep reasoning for hard, high-stakes tasks",
    family: "Meta",
    speed: "deep",
    context: "128K tokens",
  },
  {
    id: "mistralai/mistral-medium-3.5-128b",
    label: "Mistral Medium 3.5",
    hint: "Well-rounded model for text generation, coding, and agents",
    family: "Mistral",
    speed: "balanced",
    context: "128K tokens",
  },
  {
    id: "mistralai/mixtral-8x22b-instruct-v0.1",
    label: "Mixtral 8x22B",
    hint: "Fast MoE model, good for quick drafts",
    family: "Mistral",
    speed: "fast",
    context: "64K tokens",
  },
  {
    id: "mistralai/mistral-nemo-12b-instruct",
    label: "Mistral NeMo 12B",
    hint: "Built with NVIDIA — strong performance-to-size ratio",
    family: "Mistral",
    speed: "fast",
    context: "128K tokens",
  },
  {
    id: "google/gemma-3-27b-it",
    label: "Gemma 3 27B",
    hint: "Google's open model — good general chat and light coding",
    family: "Google",
    speed: "balanced",
    context: "128K tokens",
  },
  {
    id: "microsoft/phi-4",
    label: "Phi-4",
    hint: "Small, sharp reasoning model — good for fast iteration",
    family: "Microsoft",
    speed: "fast",
    context: "16K tokens",
  },
  {
    id: "ibm/granite-3.3-8b-instruct",
    label: "Granite 3.3 8B",
    hint: "IBM's compact enterprise-tuned model — quick and dependable",
    family: "IBM",
    speed: "fast",
    context: "128K tokens",
  },
  {
    id: "sarvamai/sarvam-m",
    label: "Sarvam-M",
    hint: "Specialized for Indic languages alongside English",
    family: "Sarvam AI",
    speed: "balanced",
    context: "32K tokens",
  },
];

export function modelLabel(modelId: string) {
  return NVIDIA_MODELS.find((m) => m.id === modelId)?.label ?? modelId;
}

export function modelById(modelId: string) {
  return NVIDIA_MODELS.find((m) => m.id === modelId);
}

export function modelSpeed(modelId: string): ModelSpeed {
  return NVIDIA_MODELS.find((m) => m.id === modelId)?.speed ?? "balanced";
}

export const MODEL_FAMILIES = Array.from(new Set(NVIDIA_MODELS.map((m) => m.family)));

export type NvidiaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function nvidiaChat(opts: {
  apiKey: string;
  model: string;
  messages: NvidiaMessage[];
  temperature?: number;
  maxTokens?: number;
  onToken?: (chunk: string) => void;
  /** Some NVIDIA reasoning models (R1, Nemotron) stream separate
   * `reasoning_content` deltas ahead of the final answer. Surfacing these
   * lets the UI show live "thinking" / planning text instead of a blank
   * spinner. */
  onReasoning?: (chunk: string) => void;
  signal?: AbortSignal;
}): Promise<string> {
  const {
    apiKey,
    model,
    messages,
    temperature = 0.6,
    maxTokens = 16000,
    onToken,
    onReasoning,
    signal,
  } = opts;

  if (!apiKey) throw new Error("Missing NVIDIA API key. Add it in Settings.");

  const res = await fetch("/api/nvidia-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey,
      model,
      messages,
      temperature,
      maxTokens,
    }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `NVIDIA API ${res.status}: ${res.statusText}`);
  }

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") continue;
      try {
        const json = JSON.parse(payload);
        const delta = json?.choices?.[0]?.delta ?? {};
        const reasoning = delta.reasoning_content ?? "";
        const content = delta.content ?? "";
        if (reasoning) onReasoning?.(reasoning);
        if (content) {
          full += content;
          onToken?.(content);
        }
      } catch {
        // ignore malformed SSE line
      }
    }
  }

  return full;
}
