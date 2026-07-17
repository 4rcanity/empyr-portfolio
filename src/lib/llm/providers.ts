export type LlmProviderId = "deepseek" | "glm" | "ollama" | "placeholder";

export interface ResolvedLlmConfig {
  provider: LlmProviderId;
  baseUrl: string;
  model: string;
  apiKey: string;
  /** Human label for UI / logs */
  label: string;
}

const PROVIDER_DEFAULTS: Record<
  Exclude<LlmProviderId, "placeholder">,
  { baseUrl: string; model: string; label: string }
> = {
  // DeepSeek hosted API — coding-strong V4 flash (Coder line folded into V4).
  // Override LLM_MODEL for deepseek-v4-pro if you want higher quality.
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
    label: "DeepSeek Coder (V4 Flash)",
  },
  // Zhipu GLM — glm-4-flash is the practical cloud stand-in for GLM-4-9B class.
  // Set LLM_MODEL=glm-4-9b or glm-4-flash as available on your Zhipu plan.
  glm: {
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    model: "glm-4-flash",
    label: "GLM 4.9B-class (Zhipu)",
  },
  // Local OpenAI-compatible server (Ollama).
  // Prefer glm4:9b (installed) or deepseek-coder:6.7b when pulled.
  ollama: {
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "glm4:9b",
    label: "Ollama (local DeepSeek Coder / GLM)",
  },
};

export function resolveLlmConfig(
  overrideProvider?: string | null,
): ResolvedLlmConfig | null {
  const raw = (overrideProvider ?? process.env.LLM_PROVIDER ?? "deepseek")
    .trim()
    .toLowerCase();

  if (raw === "placeholder" || raw === "none" || raw === "off") {
    return null;
  }

  const provider = (["deepseek", "glm", "ollama"].includes(raw)
    ? raw
    : "deepseek") as Exclude<LlmProviderId, "placeholder">;

  const defaults = PROVIDER_DEFAULTS[provider];
  const baseUrl = (
    process.env.LLM_BASE_URL?.trim() || defaults.baseUrl
  ).replace(/\/$/, "");
  const model = process.env.LLM_MODEL?.trim() || defaults.model;

  // Ollama often needs no key; DeepSeek / GLM require one.
  const apiKey =
    process.env.LLM_API_KEY?.trim() ||
    process.env.DEEPSEEK_API_KEY?.trim() ||
    process.env.ZHIPU_API_KEY?.trim() ||
    (provider === "ollama" ? "ollama" : "");

  if (provider !== "ollama" && apiKey.length === 0) {
    return null;
  }

  return {
    provider,
    baseUrl,
    model,
    apiKey,
    label: `${defaults.label} · ${model}`,
  };
}

export const SUPPORTED_PROVIDERS: Array<{
  id: Exclude<LlmProviderId, "placeholder">;
  label: string;
  description: string;
}> = [
  {
    id: "deepseek",
    label: "DeepSeek Coder",
    description: "Hosted DeepSeek V4 (coding-optimized layout JSON)",
  },
  {
    id: "glm",
    label: "GLM 4.9B",
    description: "Zhipu GLM-4 flash / 9B-class via OpenAI-compatible API",
  },
  {
    id: "ollama",
    label: "Ollama (local)",
    description: "Local glm4:9b / deepseek-coder:6.7b via http://127.0.0.1:11434",
  },
];
