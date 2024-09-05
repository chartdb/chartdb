import { en } from './locales/en';

export type LanguageTranslation = typeof en;

export type LanguageMetadata = {
    name: string;
    code: string;
};
