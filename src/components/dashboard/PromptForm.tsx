"use client";

import { useState, type FormEvent } from "react";
import type { LayoutDocument } from "@/types/layout";

interface PromptFormProps {
  onGenerated: (layout: LayoutDocument) => void;
}

interface GenerateSuccessResponse {
  layout: LayoutDocument;
}

interface GenerateErrorResponse {
  error: string;
  issues?: string[];
}

type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse;

export default function PromptForm({ onGenerated }: PromptFormProps) {
  const [prompt, setPrompt] = useState("");
  const [siteName, setSiteName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (trimmedPrompt.length === 0) {
      setError("Describe your business before generating a site.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const trimmedSiteName = siteName.trim();
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmedPrompt,
          ...(trimmedSiteName.length > 0 ? { siteName: trimmedSiteName } : {}),
        }),
      });

      const payload = (await response.json()) as GenerateResponse;

      if (!response.ok || !("layout" in payload)) {
        const message =
          "error" in payload && payload.error
            ? payload.error
            : "Something went wrong generating your site.";
        setError(message);
        return;
      }

      onGenerated(payload.layout);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-stone-800 bg-stone-900/40 p-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="siteName" className="text-sm font-medium text-stone-300">
          Site name <span className="text-stone-500">(optional)</span>
        </label>
        <input
          id="siteName"
          type="text"
          value={siteName}
          onChange={(event) => setSiteName(event.target.value)}
          placeholder="e.g. Northside Coffee Co."
          maxLength={200}
          disabled={isSubmitting}
          className="rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-2.5 text-sm text-stone-100 outline-none transition-colors focus:border-orange-500 disabled:opacity-60"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="prompt" className="text-sm font-medium text-stone-300">
          Describe your business
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="A cozy neighborhood coffee shop with specialty espresso, pastries, and a warm community vibe..."
          maxLength={4000}
          rows={7}
          disabled={isSubmitting}
          className="resize-none rounded-lg border border-stone-700 bg-stone-950/60 px-4 py-3 text-sm text-stone-100 outline-none transition-colors focus:border-orange-500 disabled:opacity-60"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-stone-950 transition-transform duration-150 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {isSubmitting ? "Generating\u2026" : "Generate site"}
      </button>
    </form>
  );
}
