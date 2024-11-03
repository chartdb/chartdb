import type { Diagram } from '@/lib/domain/diagram';
import { employeeDb } from './templates/employee-db';
import { visualNovelDb } from './templates/visual-novel-db';

export interface Template {
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    image: string;
    imageDark: string;
    diagram: Diagram;
    tags: string[];
    keywords: string[];
    featured: boolean;
    url?: string;
}

export const templates: Template[] = [employeeDb, visualNovelDb];
