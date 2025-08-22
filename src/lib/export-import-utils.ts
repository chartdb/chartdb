import { cloneDiagram } from './clone';
import { diagramSchema, type Diagram } from './domain/diagram';
import { generateDiagramId } from './utils';
import { adjustTablePositions } from './domain/db-table';

export const runningIdGenerator = (): (() => string) => {
    let id = 0;
    return () => (id++).toString();
};

export const cloneDiagramWithRunningIds = (
    diagram: Diagram
): { diagram: Diagram; idsMap: Map<string, string> } => {
    const { diagram: clonedDiagram, idsMap } = cloneDiagram(diagram, {
        generateId: runningIdGenerator(),
    });

    return { diagram: clonedDiagram, idsMap };
};

const cloneDiagramWithIds = (diagram: Diagram): Diagram => ({
    ...cloneDiagram(diagram).diagram,
    id: generateDiagramId(),
});

export const diagramToJSONOutput = (diagram: Diagram): string => {
    const clonedDiagram = cloneDiagramWithRunningIds(diagram).diagram;
    return JSON.stringify(clonedDiagram, null, 2);
};

export const diagramFromJSONInput = (json: string): Diagram => {
    const loadedDiagram = JSON.parse(json);

    const diagram = diagramSchema.parse({
        ...loadedDiagram,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    const clonedDiagram = cloneDiagramWithIds(diagram);

    // Apply reordering for large diagrams AFTER identifying which tables have relationships
    const LARGE_DIAGRAM_THRESHOLD = 200;

    if (
        clonedDiagram.tables &&
        clonedDiagram.tables.length > LARGE_DIAGRAM_THRESHOLD &&
        clonedDiagram.relationships
    ) {
        // Create a set of table IDs that have relationships
        const tablesWithRelationships = new Set<string>();
        clonedDiagram.relationships.forEach((rel) => {
            tablesWithRelationships.add(rel.sourceTableId);
            tablesWithRelationships.add(rel.targetTableId);
        });

        // Filter tables to only those with relationships for reordering
        const tablesToReorder = clonedDiagram.tables.filter((table) =>
            tablesWithRelationships.has(table.id)
        );

        // Apply reordering only to tables with relationships
        const reorderedTables = adjustTablePositions({
            tables: tablesToReorder,
            relationships: clonedDiagram.relationships || [],
            areas: clonedDiagram.areas || [],
            mode: 'all',
        });

        // Update positions for reordered tables
        clonedDiagram.tables = clonedDiagram.tables.map((table) => {
            const reorderedTable = reorderedTables.find(
                (t) => t.id === table.id
            );
            if (reorderedTable) {
                return {
                    ...table,
                    x: reorderedTable.x,
                    y: reorderedTable.y,
                };
            }
            return table;
        });
    }

    return clonedDiagram;
};

export const getInitialFilterForLargeDiagram = (
    diagram: Diagram
): { tableIds?: string[] } | null => {
    const LARGE_DIAGRAM_THRESHOLD = 200;

    if (
        diagram.tables &&
        diagram.tables.length > LARGE_DIAGRAM_THRESHOLD &&
        diagram.relationships
    ) {
        // Create a set of table IDs that have relationships
        const tablesWithRelationships = new Set<string>();
        diagram.relationships.forEach((rel) => {
            tablesWithRelationships.add(rel.sourceTableId);
            tablesWithRelationships.add(rel.targetTableId);
        });

        // Return only tables with relationships to be shown (filter will hide the rest)
        const tablesToShow = diagram.tables
            .filter((table) => tablesWithRelationships.has(table.id))
            .map((table) => table.id);

        // If there are tables to filter out, return the filter
        if (tablesToShow.length < diagram.tables.length) {
            return { tableIds: tablesToShow };
        }
    }

    return null;
};
