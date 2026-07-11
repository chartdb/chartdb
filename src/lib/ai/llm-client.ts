import {
    OPENAI_API_KEY,
    OPENAI_API_ENDPOINT,
    OPENROUTER_API_KEY,
    LLM_MODEL_NAME,
} from '@/lib/env';

// OpenRouter is OpenAI-compatible; default to its public endpoint + a sensible
// default model when the operator hasn't pinned one.
export const OPENROUTER_DEFAULT_ENDPOINT = 'https://openrouter.ai/api/v1';
export const OPENROUTER_DEFAULT_MODEL = 'openai/gpt-4o-mini';
export const OPENAI_DEFAULT_MODEL = 'gpt-4o-mini-2024-07-18';

export type LLMProvider = 'openai' | 'openrouter' | 'custom';

// Runtime-injected values (window.env, via Docker) take precedence over the
// build-time Vite env.
const resolveEnv = () => ({
    apiKey: window?.env?.OPENAI_API_KEY ?? OPENAI_API_KEY,
    openRouterApiKey: window?.env?.OPENROUTER_API_KEY ?? OPENROUTER_API_KEY,
    baseUrl: window?.env?.OPENAI_API_ENDPOINT ?? OPENAI_API_ENDPOINT,
    modelName: window?.env?.LLM_MODEL_NAME ?? LLM_MODEL_NAME,
});

// Determine which provider to use, or throw a helpful configuration error when
// nothing is set up. Shared by every AI feature (SQL dialect export, AI editor).
export const validateLLMConfiguration = (): { provider: LLMProvider } => {
    const { apiKey, openRouterApiKey, baseUrl, modelName } = resolveEnv();

    // OpenRouter: OpenAI-compatible, ships its own endpoint + model default
    if (openRouterApiKey) {
        return { provider: 'openrouter' };
    }

    // If using custom endpoint and model, don't require OpenAI API key
    if (baseUrl && modelName) {
        return { provider: 'custom' };
    }

    // If using OpenAI's service, require API key
    if (apiKey) {
        return { provider: 'openai' };
    }

    throw new Error(
        'Configuration Error: Provide an OpenAI API key, an OpenRouter API key, or both a custom endpoint and model name'
    );
};

interface LLMClientConfig {
    apiKey: string;
    baseUrl?: string;
}

// Resolve the provider config (apiKey/baseUrl) and the model name to call for a
// given provider. Mirrors the precedence rules in validateLLMConfiguration.
export const resolveLLMClientConfig = (
    provider: LLMProvider
): { config: LLMClientConfig; modelName: string } => {
    const { apiKey, openRouterApiKey, baseUrl, modelName } = resolveEnv();

    if (provider === 'openrouter') {
        return {
            config: {
                apiKey: openRouterApiKey,
                // Allow overriding the endpoint (e.g. a proxy) but default to OpenRouter
                baseUrl: baseUrl || OPENROUTER_DEFAULT_ENDPOINT,
            },
            modelName: modelName ?? OPENROUTER_DEFAULT_MODEL,
        };
    }

    if (provider === 'custom') {
        return {
            config: { apiKey, baseUrl },
            modelName: modelName ?? OPENAI_DEFAULT_MODEL,
        };
    }

    return {
        config: { apiKey },
        modelName: modelName ?? OPENAI_DEFAULT_MODEL,
    };
};

// Create an OpenAI-compatible client for the currently configured provider.
// Returns the `ai` SDK primitives alongside a bound model instance so callers
// can use streamText / generateText / generateObject as needed.
export const createLLMModel = async () => {
    const { provider } = validateLLMConfiguration();
    const { config, modelName } = resolveLLMClientConfig(provider);

    const [ai, { createOpenAI }] = await Promise.all([
        import('ai'),
        import('@ai-sdk/openai'),
    ]);

    const openai = createOpenAI(config);

    return {
        provider,
        modelName,
        // Use the Chat Completions API explicitly: OpenRouter, custom endpoints
        // (e.g. vLLM) and Azure-style gateways speak Chat Completions, not the
        // newer OpenAI Responses API that `openai(model)` now defaults to.
        model: openai.chat(modelName),
        streamText: ai.streamText,
        generateText: ai.generateText,
        generateObject: ai.generateObject,
    };
};

// Turn a thrown LLM error into a user-facing message. Browser calls fail in a
// few distinct ways that all deserve different guidance:
//  - config not set up (validateLLMConfiguration threw)
//  - the provider rejected the key / ran out of credit (HTTP 401/403)
//  - the browser couldn't reach the provider at all (CORS block or network),
//    which surfaces as an opaque TypeError ("Failed to fetch" / "Load failed")
//    with no readable status — common when pointing a browser straight at
//    api.openai.com, which does not serve permissive CORS.
export const describeLLMError = (error: unknown): string => {
    if (error instanceof Error && error.message.includes('Configuration')) {
        return error.message;
    }

    const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;

    if (statusCode === 401 || statusCode === 403) {
        return 'The AI provider rejected your key (HTTP 401/403). Check the key is valid and has credit, or switch to OpenRouter.';
    }

    const message = error instanceof Error ? error.message : String(error);
    if (
        error instanceof TypeError ||
        /failed to fetch|load failed|networkerror|access control/i.test(message)
    ) {
        return "Couldn't reach the AI provider from the browser. It likely rejected the key (401) or blocked the request (CORS) — check your key/credits, or use an OpenRouter key, which allows browser requests.";
    }

    return 'Could not generate changes. Check your AI configuration and try again.';
};
