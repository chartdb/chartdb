import i18n from 'i18next';
import type { Resource } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { enMetadata } from './locales/en';
import * as locales from './locales';
import type { LanguageMetadata } from './types';

type DeliberatelyAllowedAdditionalExports = 'en';

type Locales = typeof locales;
type MetadataKeys = Extract<keyof Locales, `${string}Metadata`>;

export const languageMetadatas = Object.entries(
    locales as Omit<Locales, DeliberatelyAllowedAdditionalExports>
)
    .filter(([exportedPropertyName]) =>
        exportedPropertyName.endsWith('Metadata')
    )
    .map(
        // gives values of consts, whose name ends with `Metadata`
        (exports) => exports[1]
    ) satisfies LanguageMetadata[];

type EnsureAllExportsHandled<Keys extends never> = Keys;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Test = EnsureAllExportsHandled<
    Exclude<keyof Locales, MetadataKeys | DeliberatelyAllowedAdditionalExports>
>;

export const resources = languageMetadatas.reduce(
    (acc, { code, translation }) => ({ ...acc, [code]: { translation } }),
    {} as {
        [Key in MetadataKeys as Locales[Key]['code']]: {
            translation: Locales[Key]['translation'];
        };
    }
) satisfies Resource;

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
