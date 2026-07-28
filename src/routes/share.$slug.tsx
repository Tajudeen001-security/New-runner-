import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { buildPreviewDocument, type GeneratedFile } from "../lib/skills";

export const Route = createFileRoute("/share/$slug")({
  component: SharePage,
});

function SharePage() {
  const { slug } = Route.useParams();
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; projectName: string; files: GeneratedFile[] }
  >({ status: "loading" });

  useEffect(() => {
    fetch(`/api/share?slug=${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => setState({ status: "ready", projectName: data.projectName, files: data.files }))
      .catch((err) => setState({ status: "error", message: err.message || "Couldn't load this link" }));
  }, [slug]);

  if (state.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <Sparkles className="h-8 w-8 text-gold" />
        <h1 className="text-lg font-semibold">Link unavailable</h1>
        <p className="max-w-sm text-sm text-muted-foreground">{state.message}</p>
        <Link to="/" className="mt-2 text-sm font-medium text-gold hover:underline">
          Build your own with JagX Dev →
        </Link>
      </div>
    );
  }

  const doc = buildPreviewDocument(state.files);

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex flex-none items-center justify-between border-b border-border/60 px-4 py-2">
        <span className="truncate text-sm font-medium">{state.projectName}</span>
        <Link
          to="/"
          className="flex-none rounded-md bg-gold-gradient px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-gold"
        >
          Built with JagX Dev
        </Link>
      </div>
      <div className="flex-1">
        {doc ? (
          <iframe
            title="Shared preview"
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            srcDoc={doc}
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            This project doesn't have a browser preview.
          </div>
        )}
      </div>
    </div>
  );
}
