import type { en } from './locales/en';

type RecursivelyReplaceStringLiteralsWithGeneralStringType<T> = T extends object
    ? {
          [Key in keyof T]: RecursivelyReplaceStringLiteralsWithGeneralStringType<
              T[Key]
          >;
      }
    : T extends string
      ? string
      : never;

export type LanguageTranslation =
    RecursivelyReplaceStringLiteralsWithGeneralStringType<typeof en>;

export type LanguageMetadata = {
    name: string;
    nativeName: string;
    code: string;
    translation: LanguageTranslation;
};
