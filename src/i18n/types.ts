import type { en } from './locales/en';

export type LanguageTranslation = typeof en;

export type LanguageMetadata = {
    name: string;
    nativeName: string;
    code: string;
};
