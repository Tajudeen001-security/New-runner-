import { createFileRoute } from "@tanstack/react-router";

type NvidiaChatBody = {
  apiKey?: unknown;
  model?: unknown;
  messages?: unknown;
  temperature?: unknown;
  maxTokens?: unknown;
};

function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export const Route = createFileRoute("/api/nvidia-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: NvidiaChatBody;
        try {
          body = (await request.json()) as NvidiaChatBody;
        } catch {
          return textError("Invalid request body", 400);
        }

        const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
        const model = typeof body.model === "string" ? body.model.trim() : "";
        const messages = Array.isArray(body.messages) ? body.messages : null;
        const temperature =
          typeof body.temperature === "number" && Number.isFinite(body.temperature)
            ? body.temperature
            : 0.6;
        // Agentic multi-file builds need real headroom. Default high, but let
        // the client raise or lower it per model; cap to stay within sane
        // upstream limits.
        const requestedMaxTokens =
          typeof body.maxTokens === "number" && Number.isFinite(body.maxTokens)
            ? body.maxTokens
            : 16000;
        const maxTokens = Math.max(256, Math.min(requestedMaxTokens, 32000));

        if (!apiKey) return textError("Missing NVIDIA API key", 400);
        if (!model) return textError("Choose a NVIDIA model first", 400);
        if (!messages) return textError("Messages are required", 400);

        const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            top_p: 0.95,
            max_tokens: maxTokens,
            stream: true,
          }),
        });

        if (!upstream.ok) {
          const detail = await upstream.text().catch(() => "");
          return textError(
            `NVIDIA API ${upstream.status}: ${detail || upstream.statusText || "Request failed"}`,
            upstream.status,
          );
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      },
    },
  },
});