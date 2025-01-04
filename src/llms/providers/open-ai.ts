import { OPENAI_API_KEY } from '@/lib/env';

export const promptForSQL = async (
    prompt: string,
    options?: {
        stream: boolean;
        onResultStream: (text: string) => void;
        signal?: AbortSignal;
    }
): Promise<string> => {
    const [{ streamText, generateText }, { createOpenAI }] = await Promise.all([
        import('ai'),
        import('@ai-sdk/openai'),
    ]);

    const openai = createOpenAI({
        apiKey: window?.env?.OPENAI_API_KEY ?? OPENAI_API_KEY,
    });

    if (options?.stream) {
        const { textStream, text: textPromise } = await streamText({
            model: openai('gpt-4o-mini-2024-07-18'),
            prompt: prompt,
        });

        for await (const textPart of textStream) {
            if (options.signal?.aborted) {
                return '';
            }
            options.onResultStream(textPart);
        }

        const text = await textPromise;

        return text;
    }

    const { text } = await generateText({
        model: openai('gpt-4o-mini-2024-07-18'),
        prompt: prompt,
    });

    return text;
};
