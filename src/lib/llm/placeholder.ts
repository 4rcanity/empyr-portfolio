import {
  defaultEmpyrTheme,
  layoutDocumentSchema,
  type FeatureItem,
  type LayoutDocument,
} from "@/types/layout";

export interface GenerateLayoutOptions {
  siteName?: string;
  /** Override env LLM_PROVIDER for this request: deepseek | glm | ollama */
  provider?: string;
}

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "your",
  "you",
  "are",
  "have",
  "will",
  "from",
  "into",
  "about",
  "want",
  "need",
  "site",
  "website",
  "page",
  "make",
  "build",
  "create",
  "please",
  "would",
  "like",
  "some",
  "there",
  "their",
  "them",
  "then",
  "than",
  "also",
  "just",
  "only",
]);

const FALLBACK_FEATURES: FeatureItem[] = [
  {
    title: "Fast Setup",
    description: "Launch your site in minutes with zero configuration required.",
    icon: "zap",
  },
  {
    title: "Fully Responsive",
    description: "Looks great on every device, from phones to desktops.",
    icon: "smartphone",
  },
  {
    title: "Built to Scale",
    description: "A solid foundation that grows alongside your business.",
    icon: "trending-up",
  },
];

function titleCase(word: string): string {
  return word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

function extractKeywords(prompt: string, max: number): string[] {
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word));

  const seen = new Set<string>();
  const unique: string[] = [];

  for (const word of words) {
    if (seen.has(word)) {
      continue;
    }
    seen.add(word);
    unique.push(word);
    if (unique.length >= max) {
      break;
    }
  }

  return unique;
}

function deriveSiteName(prompt: string, siteName?: string): string {
  if (siteName && siteName.trim().length > 0) {
    return siteName.trim().slice(0, 120);
  }

  const trimmed = prompt.trim();
  const firstLine = (trimmed.split(/\n/)[0] ?? trimmed).trim();
  const words = firstLine.split(/\s+/).filter(Boolean).slice(0, 6);
  const derived = words.join(" ").slice(0, 120).trim();

  return derived.length > 0 ? derived : "Untitled Site";
}

function deriveDescription(prompt: string): string {
  const normalized = prompt.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return "A new site generated with Empyr.";
  }
  return normalized.slice(0, 200);
}

function buildFeatures(prompt: string): FeatureItem[] {
  const keywords = extractKeywords(prompt, 3);

  const derived: FeatureItem[] = keywords.map((keyword, index) => ({
    title: titleCase(keyword),
    description: `Tailored around "${keyword}", as described in your prompt.`,
    icon: FALLBACK_FEATURES[index % FALLBACK_FEATURES.length].icon,
  }));

  const features = [...derived];
  let fallbackIndex = 0;
  while (features.length < 3) {
    features.push(FALLBACK_FEATURES[fallbackIndex % FALLBACK_FEATURES.length]);
    fallbackIndex += 1;
  }

  return features;
}

/** Deterministic offline layout when no LLM key / provider is available. */
export function buildPlaceholderLayout(
  prompt: string,
  opts?: GenerateLayoutOptions,
): LayoutDocument {
  const siteName = deriveSiteName(prompt, opts?.siteName);
  const description = deriveDescription(prompt);
  const features = buildFeatures(prompt);
  const year = new Date().getFullYear();

  return layoutDocumentSchema.parse({
    version: 1,
    meta: {
      siteName,
      description,
    },
    theme: defaultEmpyrTheme,
    blocks: [
      {
        type: "hero",
        eyebrow: "AI-Generated Preview",
        headline: siteName,
        subheadline: description,
        primaryCta: { label: "Get Started", href: "#features" },
        secondaryCta: { label: "Learn More", href: "#footer" },
      },
      {
        type: "featureGrid",
        heading: "What You Get",
        subheading: "Highlights generated from your prompt.",
        features,
      },
      {
        type: "footer",
        brandName: siteName,
        tagline: description,
        links: [
          { label: "Home", href: "#" },
          { label: "Features", href: "#features" },
        ],
        copyright: `\u00A9 ${year} ${siteName}. All rights reserved.`,
      },
    ],
  });
}
