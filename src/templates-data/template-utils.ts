import type { Diagram } from '@/lib/domain/diagram';
import type { Template } from './templates-data';
import { removeDups } from '@/lib/utils';
import { cloneDiagram } from '@/lib/clone';

export const convertTemplateToNewDiagram = (template: Template): Diagram => {
    const diagramId = template.diagram.id;

    const clonedDiagram = cloneDiagram(template.diagram);

    return {
        ...template.diagram,
        ...clonedDiagram,
        id: diagramId,
    };
};

export const getTemplatesAndAllTags = async ({
    featured,
    tag,
}: {
    featured?: boolean;
    tag?: string;
} = {}): Promise<{ templates: Template[]; tags: string[] }> => {
    const { templates } = await import('@/templates-data/templates-data');
    const allTags = removeDups(templates?.flatMap((t) => t.tags) ?? []);

    if (featured) {
        return {
            templates: templates.filter((t) => t.featured),
            tags: allTags,
        };
    }

    if (tag) {
        return {
            templates: templates.filter((t) =>
                t.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
            ),
            tags: allTags,
        };
    }

    return { templates, tags: allTags };
};
