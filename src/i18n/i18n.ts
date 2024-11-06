import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { LanguageMetadata } from './types';
import { en, enMetadata } from './locales/en';
import { es, esMetadata } from './locales/es';
import { fr, frMetadata } from './locales/fr';
import { de, deMetadata } from './locales/de';
import { hi, hiMetadata } from './locales/hi';
import { ja, jaMetadata } from './locales/ja';
import { pt_BR, pt_BRMetadata } from './locales/pt_BR';
import { uk, ukMetadata } from './locales/uk';
import { te, teMetadata } from './locales/te';

export const languages: LanguageMetadata[] = [
    enMetadata,
    esMetadata,
    frMetadata,
    deMetadata,
    hiMetadata,
    jaMetadata,
    pt_BRMetadata,
    ukMetadata,
    teMetadata,
];

const resources = {
    en,
    es,
    fr,
    de,
    hi,
    ja,
    pt_BR,
    uk,
    te,
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
