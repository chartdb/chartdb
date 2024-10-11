import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, enMetadata } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { hi } from './locales/hi';
import { ja } from './locales/ja';
import { ru } from './locales/ru';

const resources = {
    en,
    es,
    fr,
    de,
    hi,
    ja,
    ru,
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
