export const OPENAI_API_KEY: string = import.meta.env.VITE_OPENAI_API_KEY;
export const OPENAI_API_ENDPOINT: string = import.meta.env
    .VITE_OPENAI_API_ENDPOINT;
export const LLM_MODEL_NAME: string = import.meta.env.VITE_LLM_MODEL_NAME;
export const IS_CHARTDB_IO: boolean =
    import.meta.env.VITE_IS_CHARTDB_IO === 'true';
export const APP_URL: string = import.meta.env.VITE_APP_URL;
export const HOST_URL: string = import.meta.env.VITE_HOST_URL ?? '';
export const HIDE_CHARTDB_CLOUD: boolean =
    (window?.env?.HIDE_CHARTDB_CLOUD ??
        import.meta.env.VITE_HIDE_CHARTDB_CLOUD) === 'true';
export const DISABLE_ANALYTICS: boolean =
    (window?.env?.DISABLE_ANALYTICS ??
        import.meta.env.VITE_DISABLE_ANALYTICS) === 'true';

// Storage backend selection. Defaults to the local IndexedDB-backed store so
// self-hosters who never configure Firebase see no change in behavior.
// Set to "cloud" to store and sync diagrams via Firestore instead, enabling
// multi-user sharing of the same diagram.
export const STORAGE_MODE: 'local' | 'cloud' =
    (window?.env?.STORAGE_MODE ?? import.meta.env.VITE_STORAGE_MODE) === 'cloud'
        ? 'cloud'
        : 'local';

// Firebase project configuration, only required when STORAGE_MODE is "cloud".
export const FIREBASE_API_KEY: string =
    window?.env?.FIREBASE_API_KEY ?? import.meta.env.VITE_FIREBASE_API_KEY;
export const FIREBASE_AUTH_DOMAIN: string =
    window?.env?.FIREBASE_AUTH_DOMAIN ??
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
export const FIREBASE_PROJECT_ID: string =
    window?.env?.FIREBASE_PROJECT_ID ??
    import.meta.env.VITE_FIREBASE_PROJECT_ID;
export const FIREBASE_STORAGE_BUCKET: string =
    window?.env?.FIREBASE_STORAGE_BUCKET ??
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
export const FIREBASE_MESSAGING_SENDER_ID: string =
    window?.env?.FIREBASE_MESSAGING_SENDER_ID ??
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
export const FIREBASE_APP_ID: string =
    window?.env?.FIREBASE_APP_ID ?? import.meta.env.VITE_FIREBASE_APP_ID;
