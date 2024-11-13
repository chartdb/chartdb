import type { Diagram } from '@/lib/domain/diagram';
import { employeeDb } from './templates/employee-db';
import { visualNovelDb } from './templates/visual-novel-db';
import { airbnbDb } from './templates/airbnb-db';
import { wordpressDb } from './templates/wordpress-db';
import { pokemonDb } from './templates/pokemon-db';
import { adonisAclDb } from './templates/adonis-acl-db';
import { akauntingDb } from './templates/akaunting-db';
import { djangoDb } from './templates/django-db';
import { twitterDb } from './templates/twitter-db';
import { laravelDb } from './templates/laravel-db';
import { laravelSparkDb } from './templates/laravel-spark-db';
import { voyagerDb } from './templates/voyager-db';
import { koelDb } from './templates/koel-db';
import { laravelPermissionDb } from './templates/laravel-permission-db';
import { gravityDb } from './templates/gravity-db';

export interface Template {
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    image: string;
    imageDark: string;
    diagram: Diagram;
    tags: string[];
    featured: boolean;
    url?: string;
}

export const templates: Template[] = [
    employeeDb,
    pokemonDb,
    airbnbDb,
    wordpressDb,
    djangoDb,
    laravelDb,
    twitterDb,
    visualNovelDb,
    adonisAclDb,
    akauntingDb,
    laravelSparkDb,
    voyagerDb,
    koelDb,
    laravelPermissionDb,
    gravityDb,
];
