import { z } from "zod";

/**
 * Shared LayoutDocument contract (Empyr SaaS skeleton).
 *
 * This is the single source of truth for the AI-generated site layout
 * JSON shape. It is consumed by:
 * - `src/app/api/generate/route.ts` (Subagent B) to validate LLM output
 * - `src/components/blocks/*` + `BlockRenderer.tsx` (Subagent C) to render
 *
 * Do NOT redefine these shapes elsewhere — always import from this file.
 */

export const ctaSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(2048),
});
export type Cta = z.infer<typeof ctaSchema>;

export const themeTokensSchema = z.object({
  background: z.string().min(1),
  surface: z.string().min(1),
  text: z.string().min(1),
  muted: z.string().min(1),
  accent: z.string().min(1),
  onAccentText: z.string().min(1),
  fontHeading: z.string().min(1),
  fontBody: z.string().min(1),
});
export type ThemeTokens = z.infer<typeof themeTokensSchema>;

/**
 * Empyr brand defaults — used whenever the model omits a theme, and as the
 * default theme for marketing / dashboard preview surfaces.
 */
export const defaultEmpyrTheme: ThemeTokens = {
  background: "#0c0a09",
  surface: "#1c1917",
  text: "#f5f5f4",
  muted: "#a8a29e",
  accent: "#f97316",
  onAccentText: "#0c0a09",
  fontHeading: '"Inter", system-ui, sans-serif',
  fontBody: '"Inter", system-ui, sans-serif',
};

export const heroBlockSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().max(120).optional(),
  headline: z.string().min(1).max(200),
  subheadline: z.string().min(1).max(400),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
  imageUrl: z.string().max(2048).optional(),
});
export type HeroBlockData = z.infer<typeof heroBlockSchema>;

export const featureItemSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  icon: z.string().max(120).optional(),
});
export type FeatureItem = z.infer<typeof featureItemSchema>;

export const featureGridBlockSchema = z.object({
  type: z.literal("featureGrid"),
  heading: z.string().min(1).max(200),
  subheading: z.string().max(400).optional(),
  features: z.array(featureItemSchema).min(1).max(12),
});
export type FeatureGridBlockData = z.infer<typeof featureGridBlockSchema>;

export const footerLinkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(2048),
});
export type FooterLink = z.infer<typeof footerLinkSchema>;

export const footerBlockSchema = z.object({
  type: z.literal("footer"),
  brandName: z.string().min(1).max(120),
  tagline: z.string().max(200).optional(),
  links: z.array(footerLinkSchema).max(20),
  copyright: z.string().min(1).max(200),
});
export type FooterBlockData = z.infer<typeof footerBlockSchema>;

export const blockSchema = z.discriminatedUnion("type", [
  heroBlockSchema,
  featureGridBlockSchema,
  footerBlockSchema,
]);
export type BlockData = z.infer<typeof blockSchema>;

export type BlockType = BlockData["type"];

export const layoutMetaSchema = z.object({
  siteName: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
});
export type LayoutMeta = z.infer<typeof layoutMetaSchema>;

export const layoutDocumentSchema = z.object({
  version: z.literal(1),
  meta: layoutMetaSchema,
  theme: themeTokensSchema,
  blocks: z.array(blockSchema).min(1).max(20),
});
export type LayoutDocument = z.infer<typeof layoutDocumentSchema>;
