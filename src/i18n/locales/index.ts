import type { Resource } from 'i18next';
import type { LanguageMetadata } from '../types';
import { deMetadata } from './de';
import { enMetadata } from './en';
import { esMetadata } from './es';
import { frMetadata } from './fr';
import { hiMetadata } from './hi';
import { jaMetadata } from './ja';
import { ko_KRMetadata } from './ko_KR';
import { mrMetadata } from './mr';
import { neMetadata } from './ne';
import { pt_BRMetadata } from './pt_BR';
import { ruMetadata } from './ru';
import { ukMetadata } from './uk';
import { zh_CNMetadata } from './zh_CN';
import { zh_TWMetadata } from './zh_TW';

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
];

export const resources: Resource = languages.reduce(
    (acc, { code, translation }) => ({ ...acc, [code]: translation }),
    {}
);
