import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// When new locale files added, their contents should be reexported in ./locales/index.ts
import * as locales from './locales';
import { enMetadata } from './locales/en';

type LocalesKeys = keyof typeof locales;
type MetadataKeys = Extract<LocalesKeys, `${string}Metadata`>;
type OtherLocalesKeys = Exclude<LocalesKeys, `${string}Metadata`>;

export const languages = Object.entries(locales)
    .filter(([exportedPropertyName]) =>
        exportedPropertyName.endsWith('Metadata')
    )
    .map(
        // gives values of consts, whose name ends with `Metadata`
        (exports) => exports[1] as (typeof locales)[MetadataKeys]
    );

const resources = Object.fromEntries(
    Object.entries(locales).filter(
        ([exportedPropertyName]) =>
            // Notice _!_ to get everything else (non-metadata)
            !exportedPropertyName.endsWith('Metadata')
    )
) as Pick<typeof locales, OtherLocalesKeys>;

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
