import React, { useCallback } from 'react';
import { storageContext } from './storage-context';
import type { Diagram } from '@/lib/domain/diagram';
import type { DBTable } from '@/lib/domain/db-table';
import type { DBRelationship } from '@/lib/domain/db-relationship';
import type { DBDependency } from '@/lib/domain/db-dependency';
import type { Area } from '@/lib/domain/area';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';
import { diagramToJSONOutput } from '@/lib/export-import-utils';

const listDiagramsFromServer = async (): Promise<Diagram[]> => {
    const res = await fetch('/diagram');
    if (!res.ok) {
        return [];
    }
    return await res.json();
};

const fetchDiagram = async (id: string): Promise<Diagram | undefined> => {
    const res = await fetch(`/diagram/${id}`);
    if (!res.ok) {
        return undefined;
    }
    return await res.json();
};

const saveDiagram = async (diagram: Diagram): Promise<void> => {
    const json = diagramToJSONOutput(diagram);
    await fetch(`/diagram/${diagram.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: json,
    });
};

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const addDiagram = useCallback(
        async ({ diagram }: { diagram: Diagram }) => {
            await saveDiagram(diagram);
        },
        []
    );

    const listDiagrams = useCallback(async (): Promise<Diagram[]> => {
        return await listDiagramsFromServer();
    }, []);

    const getDiagram = useCallback(
        async (id: string): Promise<Diagram | undefined> => {
            return await fetchDiagram(id);
        },
        []
    );

    const updateDiagram = useCallback(
        async ({
            id,
            attributes,
        }: {
            id: string;
            attributes: Partial<Diagram>;
        }) => {
            const diagram = await fetchDiagram(id);
            if (!diagram) {
                return;
            }
            Object.assign(diagram, attributes);
            await saveDiagram(diagram);
        },
        []
    );

    const deleteDiagram = useCallback(async (id: string) => {
        await fetch(`/diagram/${id}`, { method: 'DELETE' });
    }, []);

    const modifyDiagram = useCallback(
        async (diagramId: string, modify: (d: Diagram) => void) => {
            const diagram = await fetchDiagram(diagramId);
            if (!diagram) {
                return;
            }
            modify(diagram);
            await saveDiagram(diagram);
        },
        []
    );

    // Config operations
    const getConfig = useCallback(async (): Promise<
        ChartDBConfig | undefined
    > => {
        const res = await fetch('/config');
        if (!res.ok) {
            return { defaultDiagramId: '' };
        }
        return await res.json();
    }, []);

    const updateConfig = useCallback(async (config: Partial<ChartDBConfig>) => {
        await fetch('/config', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config, null, 2),
        });
    }, []);

    // Diagram filter operations stored inside diagram
    const getDiagramFilter = useCallback(
        async (diagramId: string): Promise<DiagramFilter | undefined> => {
            const diagram = await fetchDiagram(diagramId);
            return (diagram as Diagram & { filter?: DiagramFilter })?.filter;
        },
        []
    );

    const updateDiagramFilter = useCallback(
        async (diagramId: string, filter: DiagramFilter) => {
            await modifyDiagram(diagramId, (d) => {
                (d as Diagram & { filter?: DiagramFilter }).filter = filter;
            });
        },
        [modifyDiagram]
    );

    const deleteDiagramFilter = useCallback(
        async (diagramId: string) => {
            await modifyDiagram(diagramId, (d) => {
                delete (d as Diagram & { filter?: DiagramFilter }).filter;
            });
        },
        [modifyDiagram]
    );

    // Table operations
    const addTable = useCallback(
        async ({ diagramId, table }: { diagramId: string; table: DBTable }) => {
            await modifyDiagram(diagramId, (d) => {
                d.tables = d.tables ?? [];
                d.tables.push(table);
            });
        },
        [modifyDiagram]
    );

    const getTable = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.tables?.find((t) => t.id === id);
        },
        []
    );

    const updateTable = useCallback(
        async ({
            id,
            attributes,
        }: {
            id: string;
            attributes: Partial<DBTable>;
        }) => {
            const diagrams = await listDiagramsFromServer();
            const diagram = diagrams.find((d) =>
                d.tables?.some((t) => t.id === id)
            );
            if (!diagram || !diagram.tables) {
                return;
            }
            const idx = diagram.tables.findIndex((t) => t.id === id);
            diagram.tables[idx] = { ...diagram.tables[idx], ...attributes };
            await saveDiagram(diagram);
        },
        []
    );

    const putTable = useCallback(
        async ({ diagramId, table }: { diagramId: string; table: DBTable }) => {
            await modifyDiagram(diagramId, (d) => {
                d.tables = d.tables ?? [];
                const index = d.tables.findIndex((t) => t.id === table.id);
                if (index >= 0) {
                    d.tables[index] = table;
                } else {
                    d.tables.push(table);
                }
            });
        },
        [modifyDiagram]
    );

    const deleteTable = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            await modifyDiagram(diagramId, (d) => {
                d.tables = (d.tables || []).filter((t) => t.id !== id);
            });
        },
        [modifyDiagram]
    );

    const listTables = useCallback(
        async (diagramId: string): Promise<DBTable[]> => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.tables ?? [];
        },
        []
    );

    const deleteDiagramTables = useCallback(
        async (diagramId: string) => {
            await modifyDiagram(diagramId, (d) => {
                d.tables = [];
            });
        },
        [modifyDiagram]
    );

    // Relationship operations
    const addRelationship = useCallback(
        async ({
            diagramId,
            relationship,
        }: {
            diagramId: string;
            relationship: DBRelationship;
        }) => {
            await modifyDiagram(diagramId, (d) => {
                d.relationships = d.relationships ?? [];
                d.relationships.push(relationship);
            });
        },
        [modifyDiagram]
    );

    const getRelationship = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.relationships?.find((r) => r.id === id);
        },
        []
    );

    const updateRelationship = useCallback(
        async ({
            id,
            attributes,
        }: {
            id: string;
            attributes: Partial<DBRelationship>;
        }) => {
            const diagrams = await listDiagramsFromServer();
            const diagram = diagrams.find((d) =>
                d.relationships?.some((r) => r.id === id)
            );
            if (!diagram || !diagram.relationships) {
                return;
            }
            const idx = diagram.relationships.findIndex((r) => r.id === id);
            diagram.relationships[idx] = {
                ...diagram.relationships[idx],
                ...attributes,
            };
            await saveDiagram(diagram);
        },
        []
    );

    const deleteRelationship = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            await modifyDiagram(diagramId, (d) => {
                d.relationships = (d.relationships || []).filter(
                    (r) => r.id !== id
                );
            });
        },
        [modifyDiagram]
    );

    const listRelationships = useCallback(
        async (diagramId: string): Promise<DBRelationship[]> => {
            const diagram = await fetchDiagram(diagramId);
            return (
                diagram?.relationships?.sort((a, b) =>
                    a.name.localeCompare(b.name)
                ) ?? []
            );
        },
        []
    );

    const deleteDiagramRelationships = useCallback(
        async (diagramId: string) => {
            await modifyDiagram(diagramId, (d) => {
                d.relationships = [];
            });
        },
        [modifyDiagram]
    );

    // Dependency operations
    const addDependency = useCallback(
        async ({
            diagramId,
            dependency,
        }: {
            diagramId: string;
            dependency: DBDependency;
        }) => {
            await modifyDiagram(diagramId, (d) => {
                d.dependencies = d.dependencies ?? [];
                d.dependencies.push(dependency);
            });
        },
        [modifyDiagram]
    );

    const getDependency = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.dependencies?.find((dep) => dep.id === id);
        },
        []
    );

    const updateDependency = useCallback(
        async ({
            id,
            attributes,
        }: {
            id: string;
            attributes: Partial<DBDependency>;
        }) => {
            const diagrams = await listDiagramsFromServer();
            const diagram = diagrams.find((d) =>
                d.dependencies?.some((dep) => dep.id === id)
            );
            if (!diagram || !diagram.dependencies) {
                return;
            }
            const idx = diagram.dependencies.findIndex((dep) => dep.id === id);
            diagram.dependencies[idx] = {
                ...diagram.dependencies[idx],
                ...attributes,
            };
            await saveDiagram(diagram);
        },
        []
    );

    const deleteDependency = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            await modifyDiagram(diagramId, (d) => {
                d.dependencies = (d.dependencies || []).filter(
                    (dep) => dep.id !== id
                );
            });
        },
        [modifyDiagram]
    );

    const listDependencies = useCallback(
        async (diagramId: string): Promise<DBDependency[]> => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.dependencies ?? [];
        },
        []
    );

    const deleteDiagramDependencies = useCallback(
        async (diagramId: string) => {
            await modifyDiagram(diagramId, (d) => {
                d.dependencies = [];
            });
        },
        [modifyDiagram]
    );

    // Area operations
    const addArea = useCallback(
        async ({ diagramId, area }: { diagramId: string; area: Area }) => {
            await modifyDiagram(diagramId, (d) => {
                d.areas = d.areas ?? [];
                d.areas.push(area);
            });
        },
        [modifyDiagram]
    );

    const getArea = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.areas?.find((a) => a.id === id);
        },
        []
    );

    const updateArea = useCallback(
        async ({
            id,
            attributes,
        }: {
            id: string;
            attributes: Partial<Area>;
        }) => {
            const diagrams = await listDiagramsFromServer();
            const diagram = diagrams.find((d) =>
                d.areas?.some((a) => a.id === id)
            );
            if (!diagram || !diagram.areas) {
                return;
            }
            const idx = diagram.areas.findIndex((a) => a.id === id);
            diagram.areas[idx] = { ...diagram.areas[idx], ...attributes };
            await saveDiagram(diagram);
        },
        []
    );

    const deleteArea = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            await modifyDiagram(diagramId, (d) => {
                d.areas = (d.areas || []).filter((a) => a.id !== id);
            });
        },
        [modifyDiagram]
    );

    const listAreas = useCallback(
        async (diagramId: string): Promise<Area[]> => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.areas ?? [];
        },
        []
    );

    const deleteDiagramAreas = useCallback(
        async (diagramId: string) => {
            await modifyDiagram(diagramId, (d) => {
                d.areas = [];
            });
        },
        [modifyDiagram]
    );

    // Custom type operations
    const addCustomType = useCallback(
        async ({
            diagramId,
            customType,
        }: {
            diagramId: string;
            customType: DBCustomType;
        }) => {
            await modifyDiagram(diagramId, (d) => {
                d.customTypes = d.customTypes ?? [];
                d.customTypes.push(customType);
            });
        },
        [modifyDiagram]
    );

    const getCustomType = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.customTypes?.find((ct) => ct.id === id);
        },
        []
    );

    const updateCustomType = useCallback(
        async ({
            id,
            attributes,
        }: {
            id: string;
            attributes: Partial<DBCustomType>;
        }) => {
            const diagrams = await listDiagramsFromServer();
            const diagram = diagrams.find((d) =>
                d.customTypes?.some((ct) => ct.id === id)
            );
            if (!diagram || !diagram.customTypes) {
                return;
            }
            const idx = diagram.customTypes.findIndex((ct) => ct.id === id);
            diagram.customTypes[idx] = {
                ...diagram.customTypes[idx],
                ...attributes,
            };
            await saveDiagram(diagram);
        },
        []
    );

    const deleteCustomType = useCallback(
        async ({ diagramId, id }: { diagramId: string; id: string }) => {
            await modifyDiagram(diagramId, (d) => {
                d.customTypes = (d.customTypes || []).filter(
                    (ct) => ct.id !== id
                );
            });
        },
        [modifyDiagram]
    );

    const listCustomTypes = useCallback(
        async (diagramId: string): Promise<DBCustomType[]> => {
            const diagram = await fetchDiagram(diagramId);
            return diagram?.customTypes ?? [];
        },
        []
    );

    const deleteDiagramCustomTypes = useCallback(
        async (diagramId: string) => {
            await modifyDiagram(diagramId, (d) => {
                d.customTypes = [];
            });
        },
        [modifyDiagram]
    );

    return (
        <storageContext.Provider
            value={{
                getConfig,
                updateConfig,
                getDiagramFilter,
                updateDiagramFilter,
                deleteDiagramFilter,
                addDiagram,
                listDiagrams,
                getDiagram,
                updateDiagram,
                deleteDiagram,
                addTable,
                getTable,
                updateTable,
                putTable,
                deleteTable,
                listTables,
                deleteDiagramTables,
                addRelationship,
                getRelationship,
                updateRelationship,
                deleteRelationship,
                listRelationships,
                deleteDiagramRelationships,
                addDependency,
                getDependency,
                updateDependency,
                deleteDependency,
                listDependencies,
                deleteDiagramDependencies,
                addArea,
                getArea,
                updateArea,
                deleteArea,
                listAreas,
                deleteDiagramAreas,
                addCustomType,
                getCustomType,
                updateCustomType,
                deleteCustomType,
                listCustomTypes,
                deleteDiagramCustomTypes,
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
