import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { LanguageMetadata } from './types';
import { en, enMetadata } from './locales/en';
import { es, esMetadata } from './locales/es';
import { fr, frMetadata } from './locales/fr';
import { de, deMetadata } from './locales/de';
import { hi, hiMetadata } from './locales/hi';
import { ja, jaMetadata } from './locales/ja';
import { ko_KR, ko_KRMetadata } from './locales/ko_KR';
import { pt_BR, pt_BRMetadata } from './locales/pt_BR';
import { uk, ukMetadata } from './locales/uk';
import { ru, ruMetadata } from './locales/ru';
import { zh_CN, zh_CNMetadata } from './locales/zh_CN';
import { zh_TW, zh_TWMetadata } from './locales/zh_TW';
import { ne, neMetadata } from './locales/ne';
import { mr, mrMetadata } from './locales/mr';
import { tr, trMetadata } from './locales/tr';
import { id_ID, id_IDMetadata } from './locales/id_ID';
import { te, teMetadata } from './locales/te';
import { bn, bnMetadata } from './locales/bn';
import { gu, guMetadata } from './locales/gu';
import { vi, viMetadata } from './locales/vi';
import { ar, arMetadata } from './locales/ar';

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
    ruMetadata,
    zh_CNMetadata,
    zh_TWMetadata,
    neMetadata,
    mrMetadata,
    trMetadata,
    id_IDMetadata,
    teMetadata,
    bnMetadata,
    guMetadata,
    viMetadata,
    arMetadata,
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
    ru,
    zh_CN,
    zh_TW,
    ne,
    mr,
    tr,
    id_ID,
    te,
    bn,
    gu,
    vi,
    ar,
};

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        interpolation: {
            escapeValue: false,
        },
        fallbackLng: enMetadata.code,
        debug: false,
    });

export { i18n };
