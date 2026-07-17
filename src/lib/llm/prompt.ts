import { defaultEmpyrTheme, type LayoutDocument } from "@/types/layout";

/**
 * System prompt that forces a single LayoutDocument JSON object.
 * Used by DeepSeek / GLM / Ollama OpenAI-compatible chat completions.
 */
export function buildSystemPrompt(): string {
  const themeExample = JSON.stringify(defaultEmpyrTheme);

  return `You are Empyr's site layout generator. Given a business description, return ONLY one valid JSON object (no markdown, no prose) matching this TypeScript shape:

{
  "version": 1,
  "meta": { "siteName": string, "description"?: string },
  "theme": {
    "background": string, "surface": string, "text": string, "muted": string,
    "accent": string, "onAccentText": string,
    "fontHeading": string, "fontBody": string
  },
  "blocks": Array of exactly these block types (include all three at least once):
    { "type": "hero", "eyebrow"?: string, "headline": string, "subheadline": string,
      "primaryCta": { "label": string, "href": string },
      "secondaryCta"?: { "label": string, "href": string }, "imageUrl"?: string }
    { "type": "featureGrid", "heading": string, "subheading"?: string,
      "features": [{ "title": string, "description": string, "icon"?: string }] (3-6 items) }
    { "type": "footer", "brandName": string, "tagline"?: string,
      "links": [{ "label": string, "href": string }], "copyright": string }
}

Rules:
- Prefer a dark stone palette inspired by Empyr defaults when unsure: ${themeExample}
- Use Inter or distinctive heading/body font stacks as CSS font-family strings
- CTAs should use in-page anchors like "#features" and "#footer" unless a real URL is implied
- Copy must match the business description; be specific, not generic filler
- Output must be parseable JSON only`;
}

export function buildUserPrompt(
  prompt: string,
  opts?: { siteName?: string },
): string {
  const siteNameLine = opts?.siteName
    ? `Preferred site name: ${opts.siteName}\n`
    : "";
  return `${siteNameLine}Business description:\n${prompt}\n\nReturn the LayoutDocument JSON now.`;
}

/** Extract a JSON object from model output that may include fences or prose. */
export function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    // fall through
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return JSON.parse(fenced[1].trim()) as unknown;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    return JSON.parse(trimmed.slice(start, end + 1)) as unknown;
  }

  throw new Error("Model response did not contain valid JSON");
}

export type { LayoutDocument };
