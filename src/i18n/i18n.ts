import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageMetadata } from './types';
import { en, enMetadata } from './locales/en';
import { es, esMetadata } from './locales/es';
import { fr, frMetadata } from './locales/fr';
import { de, deMetadata } from './locales/de';
import { hi, hiMetadata } from './locales/hi';
import { ja, jaMetadata } from './locales/ja';
import { ko_KR, ko_KRMetadata } from './locales/ko_KR.ts';
import { pt_BR, pt_BRMetadata } from './locales/pt_BR';
import { uk, ukMetadata } from './locales/uk';
import { zh_TW, zh_TWMetadata } from './locales/zh_TW';

export const languages: LanguageMetadata[] = [
    enMetadata,
    esMetadata,
    frMetadata,
    deMetadata,
    hiMetadata,
    jaMetadata,
    ko_KRMetadata,
    pt_BRMetadata,
    ukMetadata,
    zh_TWMetadata,
];

const resources = {
    en,
    es,
    fr,
    de,
    hi,
    ja,
    ko_KR,
    pt_BR,
    uk,
    zh_TW,
};

i18n.use(initReactI18next).init({
    resources,
    lng: enMetadata.code,
    interpolation: {
        escapeValue: false,
    },
    fallbackLng: enMetadata.code,
    debug: false,
});

export { i18n };
