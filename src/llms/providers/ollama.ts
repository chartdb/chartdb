import { ollamaSelectedModelKey } from '@/context/local-config-context/local-config-provider';
import { OLLAMA_ENDPOINT } from '@/lib/env';
import { Ollama, type ModelResponse } from 'ollama/browser';

export const promptForSQL = async (
    prompt: string,
    options?: {
        stream: boolean;
        onResultStream: (text: string) => void;
        signal?: AbortSignal;
    }
): Promise<string> => {
    const ollamaSelectedModel = localStorage.getItem(ollamaSelectedModelKey);

    const ollama = new Ollama({
        host: window?.env?.OLLAMA_ENDPOINT ?? OLLAMA_ENDPOINT,
    });

    if (!ollamaSelectedModel) {
        throw Error(`No Ollama model selected.`);
    }

    if (options?.stream) {
        const response = await ollama.generate({
            model: ollamaSelectedModel,
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
        model: ollamaSelectedModel,
        prompt: prompt,
    });

    return response;
};

// The response from `ollama.list()` has the `model` field in the data, but not
// in the interface exposed by the package.
interface OllamaModelResponse extends ModelResponse {
    model: string;
}

export const getModels = async () => {
    const ollama = new Ollama({
        host: window?.env?.OLLAMA_ENDPOINT ?? OLLAMA_ENDPOINT,
    });

    try {
        const availableModels = await ollama.list();

        return (availableModels.models as OllamaModelResponse[]).map(
            (m) => m.model
        );
    } catch {
        console.warn(
            `no running ollama instance found or unable to fetch models`
        );
    }

    return [];
};
