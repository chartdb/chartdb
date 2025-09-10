import { cloneDiagram } from './clone';
import { diagramSchema, type Diagram } from './domain/diagram';
import { generateDiagramId } from './utils';

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

export const diagramToStorageJSON = (diagram: Diagram): Diagram => ({
    ...diagram,
    tables: (diagram.tables ?? []).map((table) => ({
        ...table,
        x: table.x ?? 0,
        y: table.y ?? 0,
    })),
    relationships: diagram.relationships ?? [],
    dependencies: diagram.dependencies ?? [],
    areas: (diagram.areas ?? []).map((area) => ({
        ...area,
        x: area.x ?? 0,
        y: area.y ?? 0,
        width: area.width ?? 0,
        height: area.height ?? 0,
    })),
    customTypes: diagram.customTypes ?? [],
});

export const diagramFromJSONInput = (json: string): Diagram => {
    const loadedDiagram = JSON.parse(json);

    const diagram = diagramSchema.parse({
        ...loadedDiagram,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    return cloneDiagramWithIds(diagram);
};
