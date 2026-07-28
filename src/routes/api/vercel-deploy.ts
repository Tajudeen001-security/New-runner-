import { createFileRoute } from "@tanstack/react-router";

function textError(message: string, status: number) {
  return new Response(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

type Body = {
  token?: unknown;
  projectName?: unknown;
  files?: unknown;
};

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "jagx-project";
}

export const Route = createFileRoute("/api/vercel-deploy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return textError("Invalid request body", 400);
        }

        const token = typeof body.token === "string" ? body.token.trim() : "";
        const projectName = typeof body.projectName === "string" ? body.projectName : "jagx-project";
        const files = Array.isArray(body.files) ? body.files : null;

        if (!token) return textError("Add your Vercel token in Settings first.", 400);
        if (!files || files.length === 0) return textError("Nothing to deploy yet.", 400);

        const deployFiles = files
          .filter(
            (f: any) => f && typeof f.path === "string" && typeof f.content === "string",
          )
          .map((f: any) => ({ file: f.path.replace(/^\.?\//, ""), data: f.content }));

        if (deployFiles.length === 0) return textError("No valid files to deploy.", 400);

        const vercelRes = await fetch("https://api.vercel.com/v13/deployments", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: slugify(projectName),
            files: deployFiles,
            target: "production",
            projectSettings: {
              framework: null,
              buildCommand: null,
              outputDirectory: null,
            },
          }),
        });

        const data = await vercelRes.json().catch(() => null);

        if (!vercelRes.ok) {
          const message = data?.error?.message || vercelRes.statusText;
          return textError(`Vercel error: ${message}`, vercelRes.status);
        }

        const url = data?.url ? `https://${data.url}` : null;
        if (!url) return textError("Vercel didn't return a deployment URL.", 502);

        return new Response(JSON.stringify({ url, id: data.id }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
