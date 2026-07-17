import {
  buildSystemPrompt,
  buildUserPrompt,
  extractJsonObject,
} from "@/lib/llm/prompt";
import type { ResolvedLlmConfig } from "@/lib/llm/providers";
import {
  layoutDocumentSchema,
  type LayoutDocument,
} from "@/types/layout";

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  error?: { message?: string };
}

/**
 * Call an OpenAI-compatible chat completions endpoint and parse a LayoutDocument.
 */
export async function generateLayoutWithChatApi(
  prompt: string,
  opts: { siteName?: string } | undefined,
  config: ResolvedLlmConfig,
): Promise<LayoutDocument> {
  const url = `${config.baseUrl}/chat/completions`;

  // Ollama and some local servers reject response_format; hosted APIs prefer it.
  const body: Record<string, unknown> = {
    model: config.model,
    temperature: 0.4,
    max_tokens: 4096,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(prompt, opts) },
    ],
  };
  if (config.provider !== "ollama") {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const rawText = await response.text();
  let payload: ChatCompletionResponse;
  try {
    payload = JSON.parse(rawText) as ChatCompletionResponse;
  } catch {
    throw new Error(
      `LLM returned non-JSON HTTP ${response.status}: ${rawText.slice(0, 200)}`,
    );
  }

  if (!response.ok) {
    const message =
      payload.error?.message ??
      `LLM request failed with status ${response.status}`;
    throw new Error(message);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("LLM response missing message content");
  }

  const parsed = extractJsonObject(content);
  return layoutDocumentSchema.parse(parsed);
}
