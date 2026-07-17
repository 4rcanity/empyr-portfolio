import { generateLayoutWithChatApi } from "@/lib/llm/client";
import {
  buildPlaceholderLayout,
  type GenerateLayoutOptions,
} from "@/lib/llm/placeholder";
import { resolveLlmConfig } from "@/lib/llm/providers";
import {
  layoutDocumentSchema,
  type LayoutDocument,
} from "@/types/layout";

export type { GenerateLayoutOptions };
export { buildPlaceholderLayout } from "@/lib/llm/placeholder";
export { SUPPORTED_PROVIDERS, resolveLlmConfig } from "@/lib/llm/providers";
export type { LlmProviderId } from "@/lib/llm/providers";

export interface GenerateLayoutResult {
  layout: LayoutDocument;
  provider: string;
  model: string | null;
  usedFallback: boolean;
}

/**
 * Generate a LayoutDocument via DeepSeek / GLM / Ollama when configured,
 * otherwise fall back to the deterministic placeholder.
 */
export async function generateLayout(
  prompt: string,
  opts?: GenerateLayoutOptions,
): Promise<LayoutDocument> {
  const result = await generateLayoutDetailed(prompt, opts);
  return result.layout;
}

export async function generateLayoutDetailed(
  prompt: string,
  opts?: GenerateLayoutOptions,
): Promise<GenerateLayoutResult> {
  const config = resolveLlmConfig(opts?.provider);

  if (config) {
    try {
      const layout = await generateLayoutWithChatApi(prompt, opts, config);
      return {
        layout: layoutDocumentSchema.parse(layout),
        provider: config.provider,
        model: config.model,
        usedFallback: false,
      };
    } catch (error) {
      console.error(
        `LLM provider ${config.provider}/${config.model} failed:`,
        error,
      );
      // Fall through to placeholder so the dashboard still works.
    }
  }

  const layout = buildPlaceholderLayout(prompt, opts);
  return {
    layout,
    provider: "placeholder",
    model: null,
    usedFallback: true,
  };
}
