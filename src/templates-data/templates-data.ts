import type { Diagram } from '@/lib/domain/diagram';
import { employeeDb } from './templates/employee-db';
import { visualNovelDb } from './templates/visual-novel-db';
import { airbnbDb } from './templates/airbnb-db';
import { wordpressDb } from './templates/wordpress-db';
import { pokemonDb } from './templates/pokemon-db';

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
    visualNovelDb,
    airbnbDb,
    wordpressDb,
    pokemonDb,
];
