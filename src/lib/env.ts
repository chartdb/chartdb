export const OPENAI_API_KEY: string = import.meta.env.VITE_OPENAI_API_KEY;
export const OLLAMA_ENDPOINT: string = import.meta.env.VITE_OLLAMA_ENDPOINT;
export const OLLAMA_ENABLED: boolean = import.meta.env.VITE_OLLAMA_ENABLED;
export const IS_CHARTDB_IO: boolean =
    import.meta.env.VITE_IS_CHARTDB_IO === 'true';
export const APP_URL: string = import.meta.env.VITE_APP_URL;
export const HOST_URL: string = import.meta.env.VITE_HOST_URL ?? '';
