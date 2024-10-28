import type { Diagram } from '@/lib/domain/diagram';
import { employeeDb } from './templates/employee-db';

export interface Template {
    id: string;
    slug: string;
    name: string;
    shortDescription: string;
    description: string;
    image: string;
    imageDark: string;
    diagram: Diagram;
    tags: string[];
    featured: boolean;
}

export const templates: Template[] = [employeeDb];
