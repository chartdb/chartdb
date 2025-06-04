export const OPENAI_API_KEY: string = import.meta.env.VITE_OPENAI_API_KEY;
export const OPENAI_API_ENDPOINT: string = import.meta.env
    .VITE_OPENAI_API_ENDPOINT;
export const LLM_MODEL_NAME: string = import.meta.env.VITE_LLM_MODEL_NAME;
export const IS_CHARTDB_IO: boolean =
    import.meta.env.VITE_IS_CHARTDB_IO === 'true';
export const APP_URL: string = import.meta.env.VITE_APP_URL;
export const HOST_URL: string = import.meta.env.VITE_HOST_URL ?? '';
export const HIDE_BUCKLE_DOT_DEV: boolean =
    (window?.env?.HIDE_BUCKLE_DOT_DEV ??
        import.meta.env.VITE_HIDE_BUCKLE_DOT_DEV) === 'true';
export const MINIO_ENDPOINT: string = import.meta.env.VITE_MINIO_ENDPOINT;
export const MINIO_USE_SSL: boolean =
    (window?.env?.MINIO_USE_SSL ?? import.meta.env.VITE_MINIO_USE_SSL) ===
    'true';
export const MINIO_ACCESS_KEY: string = import.meta.env.VITE_MINIO_ACCESS_KEY;
export const MINIO_SECRET_KEY: string = import.meta.env.VITE_MINIO_SECRET_KEY;
export const MINIO_BUCKET_NAME: string = import.meta.env.VITE_MINIO_BUCKET_NAME;
