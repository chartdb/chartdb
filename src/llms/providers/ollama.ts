import { OLLAMA_MODEL, OLLAMA_ENDPOINT } from '@/lib/env';

// fallback model if one is not supplied via env var.
// llama3.2:3b is a 2GB model
const DEFAULT_OLLAMA_MODEL = 'llama3.2:3b';

export const promptForSQL = async (
    prompt: string,
    options?: {
        stream: boolean;
        onResultStream: (text: string) => void;
        signal?: AbortSignal;
    }
): Promise<string> => {
    const [{ Ollama }] = await Promise.all([import('ollama')]);

    const ollama = new Ollama({ host: OLLAMA_ENDPOINT });
    const modelToUse = OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;

    if (options?.stream) {
        const response = await ollama.generate({
            model: modelToUse,
            prompt: prompt,
            stream: true,
        });

        const text: string[] = [];
        for await (const part of response) {
            if (options.signal?.aborted) {
                response.abort();
                return ``;
            }

            options.onResultStream(part.response);
            text.push(part.response);
        }

        const fullText = text.join(``);
        return fullText;
    }

    const { response } = await ollama.generate({
        model: modelToUse,
        prompt: prompt,
    });

    return response;
};
