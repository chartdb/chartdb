import type { Resource } from 'i18next';
import type { LanguageMetadata } from '../types';

import { deMetadata } from './de';
import { enMetadata } from './en';
import { esMetadata } from './es';
import { frMetadata } from './fr';
import { guMetadata } from './gu';
import { hiMetadata } from './hi';
import { id_IDMetadata } from './id_ID';
import { jaMetadata } from './ja';
import { ko_KRMetadata } from './ko_KR';
import { mrMetadata } from './mr';
import { neMetadata } from './ne';
import { pt_BRMetadata } from './pt_BR';
import { ruMetadata } from './ru';
import { teMetadata } from './te';
import { trMetadata } from './tr';
import { ukMetadata } from './uk';
import { viMetadata } from './vi';
import { zh_CNMetadata } from './zh_CN';
import { zh_TWMetadata } from './zh_TW';

export const languageMetadatas = [
    deMetadata,
    enMetadata,
    esMetadata,
    frMetadata,
    guMetadata,
    hiMetadata,
    id_IDMetadata,
    jaMetadata,
    ko_KRMetadata,
    mrMetadata,
    neMetadata,
    pt_BRMetadata,
    ruMetadata,
    teMetadata,
    trMetadata,
    ukMetadata,
    viMetadata,
    zh_CNMetadata,
    zh_TWMetadata,
] as const satisfies LanguageMetadata[];

export const resources = languageMetadatas.reduce(
    (acc, { code, translation }) => ({ ...acc, [code]: { translation } }),
    {} as IterateOverMetadataArray<typeof languageMetadatas>
) satisfies Resource;

type IterateOverMetadataArray<T> = T extends [
    infer Element extends LanguageMetadata,
    ...infer Rest,
]
    ? {
          [key in Element['code']]: { translation: Element['translation'] };
      } & IterateOverMetadataArray<Rest>
    : object;
