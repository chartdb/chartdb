import React, { useCallback, useRef } from 'react';
import type { StorageContext } from './storage-context';
import { storageContext } from './storage-context';
import type { Diagram } from '@/lib/domain/diagram';
import type { ChartDBConfig } from '@/lib/domain/config';
import type { DiagramFilter } from '@/lib/domain/diagram-filter/diagram-filter';

const API_BASE = '/api';
const defaultConfig: ChartDBConfig = {
    defaultDiagramId: '',
    hideSocialLinks: false,
};

type DiagramPayload = Omit<Diagram, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

type DiagramCacheEntry = {
    diagram: Diagram;
    isFull: boolean;
};

const serializeDiagram = (diagram: Diagram): DiagramPayload => ({
    ...diagram,
    createdAt: diagram.createdAt.toISOString(),
    updatedAt: diagram.updatedAt.toISOString(),
});

const deserializeDiagram = (diagram: DiagramPayload): Diagram => ({
    ...diagram,
    createdAt: new Date(diagram.createdAt),
    updatedAt: new Date(diagram.updatedAt),
});

const buildIncludeParam = (options?: {
    includeTables?: boolean;
    includeRelationships?: boolean;
    includeDependencies?: boolean;
    includeAreas?: boolean;
    includeCustomTypes?: boolean;
    includeNotes?: boolean;
}) => {
    if (!options) {
        return '';
    }

    const includes: string[] = [];

    if (options.includeTables) includes.push('tables');
    if (options.includeRelationships) includes.push('relationships');
    if (options.includeDependencies) includes.push('dependencies');
    if (options.includeAreas) includes.push('areas');
    if (options.includeCustomTypes) includes.push('customTypes');
    if (options.includeNotes) includes.push('notes');

    if (includes.length === 0) return '';

    return `?include=${includes.join(',')}`;
};

const isFullInclude = (options?: {
    includeTables?: boolean;
    includeRelationships?: boolean;
    includeDependencies?: boolean;
    includeAreas?: boolean;
    includeCustomTypes?: boolean;
    includeNotes?: boolean;
}) => {
    if (!options) return false;
    return (
        options.includeTables === true &&
        options.includeRelationships === true &&
        options.includeDependencies === true &&
        options.includeAreas === true &&
        options.includeCustomTypes === true &&
        options.includeNotes === true
    );
};

const fetchJson = async <T,>(
    url: string,
    options?: RequestInit,
    allowNotFound = false
): Promise<T | undefined> => {
    const headers = new Headers(options?.headers ?? undefined);
    if (options?.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const apiToken =
        window.env?.CHARTDB_API_TOKEN ?? import.meta.env.VITE_CHARTDB_API_TOKEN;
    if (apiToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${apiToken}`);
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (allowNotFound && response.status === 404) {
        return undefined;
    }

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    if (response.status === 204) {
        return undefined;
    }

    return (await response.json()) as T;
};

export const StorageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const diagramCacheRef = useRef(new Map<string, DiagramCacheEntry>());
    const tableIndexRef = useRef(new Map<string, string>());
    const relationshipIndexRef = useRef(new Map<string, string>());
    const dependencyIndexRef = useRef(new Map<string, string>());
    const areaIndexRef = useRef(new Map<string, string>());
    const customTypeIndexRef = useRef(new Map<string, string>());
    const noteIndexRef = useRef(new Map<string, string>());
    const diagramLocksRef = useRef(new Map<string, Promise<void>>());
    const deletedDiagramsRef = useRef(new Set<string>());

    const removeDiagramFromIndex = useCallback((diagramId: string) => {
        const indexes = [
            tableIndexRef.current,
            relationshipIndexRef.current,
            dependencyIndexRef.current,
            areaIndexRef.current,
            customTypeIndexRef.current,
            noteIndexRef.current,
        ];

        for (const index of indexes) {
            for (const [key, value] of index.entries()) {
                if (value === diagramId) {
                    index.delete(key);
                }
            }
        }
    }, []);

    const indexDiagram = useCallback(
        (diagram: Diagram) => {
            removeDiagramFromIndex(diagram.id);

            for (const table of diagram.tables ?? []) {
                tableIndexRef.current.set(table.id, diagram.id);
            }
            for (const relationship of diagram.relationships ?? []) {
                relationshipIndexRef.current.set(relationship.id, diagram.id);
            }
            for (const dependency of diagram.dependencies ?? []) {
                dependencyIndexRef.current.set(dependency.id, diagram.id);
            }
            for (const area of diagram.areas ?? []) {
                areaIndexRef.current.set(area.id, diagram.id);
            }
            for (const customType of diagram.customTypes ?? []) {
                customTypeIndexRef.current.set(customType.id, diagram.id);
            }
            for (const note of diagram.notes ?? []) {
                noteIndexRef.current.set(note.id, diagram.id);
            }
        },
        [removeDiagramFromIndex]
    );

    const cacheDiagram = useCallback(
        (diagram: Diagram, isFull: boolean) => {
            diagramCacheRef.current.set(diagram.id, { diagram, isFull });
            if (isFull) {
                indexDiagram(diagram);
            }
        },
        [indexDiagram]
    );

    const removeDiagramFromCache = useCallback(
        (diagramId: string) => {
            diagramCacheRef.current.delete(diagramId);
            removeDiagramFromIndex(diagramId);
        },
        [removeDiagramFromIndex]
    );

    const resolveDiagramIdForEntity = useCallback(
        (entityId: string, index: Map<string, string>, key: keyof Diagram) => {
            const cachedId = index.get(entityId);
            if (cachedId) return cachedId;

            for (const [
                diagramId,
                entry,
            ] of diagramCacheRef.current.entries()) {
                if (!entry.isFull) continue;
                const collection = entry.diagram[key] as
                    | { id: string }[]
                    | undefined;
                if (collection?.some((item) => item.id === entityId)) {
                    index.set(entityId, diagramId);
                    return diagramId;
                }
            }

            return undefined;
        },
        []
    );

    const enqueueDiagramTask = useCallback(
        async <T,>(diagramId: string, task: () => Promise<T>): Promise<T> => {
            const locks = diagramLocksRef.current;
            const previous = locks.get(diagramId) ?? Promise.resolve();
            const next = previous.then(task, task);
            locks.set(
                diagramId,
                next.then(
                    () => undefined,
                    () => undefined
                )
            );
            return next;
        },
        []
    );

    const saveDiagram = useCallback(async (diagram: Diagram) => {
        await fetchJson(
            `${API_BASE}/diagrams/${encodeURIComponent(diagram.id)}`,
            {
                method: 'PUT',
                body: JSON.stringify(serializeDiagram(diagram)),
            }
        );
    }, []);

    const deleteDiagramFile = useCallback(async (diagramId: string) => {
        await fetchJson(
            `${API_BASE}/diagrams/${encodeURIComponent(diagramId)}`,
            { method: 'DELETE' },
            true
        );
    }, []);

    const fetchDiagram = useCallback(
        async (
            diagramId: string,
            options?: {
                includeTables?: boolean;
                includeRelationships?: boolean;
                includeDependencies?: boolean;
                includeAreas?: boolean;
                includeCustomTypes?: boolean;
                includeNotes?: boolean;
            }
        ) => {
            const response = await fetchJson<DiagramPayload>(
                `${API_BASE}/diagrams/${encodeURIComponent(diagramId)}${buildIncludeParam(
                    options
                )}`,
                undefined,
                true
            );

            if (!response) return undefined;

            const diagram = deserializeDiagram(response);
            if (isFullInclude(options)) {
                cacheDiagram(diagram, true);
            }
            return diagram;
        },
        [cacheDiagram]
    );

    const getFullDiagram = useCallback(
        async (diagramId: string): Promise<Diagram | undefined> => {
            const cached = diagramCacheRef.current.get(diagramId);
            if (cached?.isFull) {
                return cached.diagram;
            }

            const diagram = await fetchDiagram(diagramId, {
                includeTables: true,
                includeRelationships: true,
                includeDependencies: true,
                includeAreas: true,
                includeCustomTypes: true,
                includeNotes: true,
            });
            if (diagram) {
                cacheDiagram(diagram, true);
            }
            return diagram;
        },
        [cacheDiagram, fetchDiagram]
    );

    const getConfig: StorageContext['getConfig'] = useCallback(async () => {
        const config = await fetchJson<ChartDBConfig>(
            `${API_BASE}/config`,
            undefined,
            true
        );
        return config ?? defaultConfig;
    }, []);

    const updateConfig: StorageContext['updateConfig'] = useCallback(
        async (config) => {
            await fetchJson(`${API_BASE}/config`, {
                method: 'PUT',
                body: JSON.stringify(config),
            });
        },
        []
    );

    const getDiagramFilter: StorageContext['getDiagramFilter'] = useCallback(
        async (diagramId: string) => {
            return await fetchJson<DiagramFilter>(
                `${API_BASE}/diagram-filters/${encodeURIComponent(diagramId)}`,
                undefined,
                true
            );
        },
        []
    );

    const updateDiagramFilter: StorageContext['updateDiagramFilter'] =
        useCallback(async (diagramId, filter) => {
            await fetchJson(
                `${API_BASE}/diagram-filters/${encodeURIComponent(diagramId)}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(filter),
                }
            );
        }, []);

    const deleteDiagramFilter: StorageContext['deleteDiagramFilter'] =
        useCallback(async (diagramId: string) => {
            await fetchJson(
                `${API_BASE}/diagram-filters/${encodeURIComponent(diagramId)}`,
                { method: 'DELETE' },
                true
            );
        }, []);

    const addDiagram: StorageContext['addDiagram'] = useCallback(
        async ({ diagram }) => {
            deletedDiagramsRef.current.delete(diagram.id);
            cacheDiagram(diagram, true);
            await saveDiagram(diagram);
        },
        [cacheDiagram, saveDiagram]
    );

    const listDiagrams: StorageContext['listDiagrams'] = useCallback(
        async (options) => {
            const response = await fetchJson<DiagramPayload[]>(
                `${API_BASE}/diagrams${buildIncludeParam(options)}`
            );
            const diagrams = (response ?? []).map(deserializeDiagram);

            if (isFullInclude(options)) {
                for (const diagram of diagrams) {
                    cacheDiagram(diagram, true);
                }
            }

            return diagrams;
        },
        [cacheDiagram]
    );

    const getDiagram: StorageContext['getDiagram'] = useCallback(
        async (id, options) => {
            return await fetchDiagram(id, options);
        },
        [fetchDiagram]
    );

    const updateDiagram: StorageContext['updateDiagram'] = useCallback(
        async ({ id, attributes }) => {
            await enqueueDiagramTask(id, async () => {
                if (deletedDiagramsRef.current.has(id)) return;

                const diagram = await getFullDiagram(id);
                if (!diagram) return;

                const updated = { ...diagram, ...attributes };
                const newId = attributes.id ?? id;
                updated.id = newId;

                if (newId !== id) {
                    removeDiagramFromCache(id);
                }

                cacheDiagram(updated, true);
                await saveDiagram(updated);

                if (newId !== id) {
                    deletedDiagramsRef.current.add(id);
                    await deleteDiagramFile(id);
                    deletedDiagramsRef.current.delete(id);
                }
            });
        },
        [
            cacheDiagram,
            deleteDiagramFile,
            enqueueDiagramTask,
            getFullDiagram,
            removeDiagramFromCache,
            saveDiagram,
        ]
    );

    const deleteDiagram: StorageContext['deleteDiagram'] = useCallback(
        async (id) => {
            deletedDiagramsRef.current.add(id);
            removeDiagramFromCache(id);
            await deleteDiagramFile(id);
        },
        [deleteDiagramFile, removeDiagramFromCache]
    );

    const addTable: StorageContext['addTable'] = useCallback(
        async ({ diagramId, table }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const tables = diagram.tables ?? [];
                diagram.tables = [...tables, table];
                tableIndexRef.current.set(table.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const getTable: StorageContext['getTable'] = useCallback(
        async ({ id, diagramId }) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.tables?.find((table) => table.id === id);
        },
        [getFullDiagram]
    );

    const deleteDiagramTables: StorageContext['deleteDiagramTables'] =
        useCallback(
            async (diagramId) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram) return;
                    diagram.tables = [];
                    indexDiagram(diagram);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, indexDiagram, saveDiagram]
        );

    const updateTable: StorageContext['updateTable'] = useCallback(
        async ({ id, attributes }) => {
            const diagramId = resolveDiagramIdForEntity(
                id,
                tableIndexRef.current,
                'tables'
            );
            if (!diagramId) return;

            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.tables) return;
                const tables = [...diagram.tables];
                const index = tables.findIndex((table) => table.id === id);
                if (index === -1) return;
                tables[index] = { ...tables[index], ...attributes };
                diagram.tables = tables;
                await saveDiagram(diagram);
            });
        },
        [
            enqueueDiagramTask,
            getFullDiagram,
            resolveDiagramIdForEntity,
            saveDiagram,
        ]
    );

    const putTable: StorageContext['putTable'] = useCallback(
        async ({ diagramId, table }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const tables = [...(diagram.tables ?? [])];
                const index = tables.findIndex((item) => item.id === table.id);
                if (index === -1) {
                    tables.push(table);
                } else {
                    tables[index] = table;
                }
                diagram.tables = tables;
                tableIndexRef.current.set(table.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const deleteTable: StorageContext['deleteTable'] = useCallback(
        async ({ id, diagramId }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.tables) return;
                diagram.tables = diagram.tables.filter(
                    (table) => table.id !== id
                );
                tableIndexRef.current.delete(id);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const listTables: StorageContext['listTables'] = useCallback(
        async (diagramId) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.tables ?? [];
        },
        [getFullDiagram]
    );

    const addRelationship: StorageContext['addRelationship'] = useCallback(
        async ({ diagramId, relationship }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const relationships = diagram.relationships ?? [];
                diagram.relationships = [...relationships, relationship];
                relationshipIndexRef.current.set(relationship.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const deleteDiagramRelationships: StorageContext['deleteDiagramRelationships'] =
        useCallback(
            async (diagramId) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram) return;
                    diagram.relationships = [];
                    indexDiagram(diagram);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, indexDiagram, saveDiagram]
        );

    const getRelationship: StorageContext['getRelationship'] = useCallback(
        async ({ id, diagramId }) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.relationships?.find((rel) => rel.id === id);
        },
        [getFullDiagram]
    );

    const updateRelationship: StorageContext['updateRelationship'] =
        useCallback(
            async ({ id, attributes }) => {
                const diagramId = resolveDiagramIdForEntity(
                    id,
                    relationshipIndexRef.current,
                    'relationships'
                );
                if (!diagramId) return;

                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram?.relationships) return;
                    const relationships = [...diagram.relationships];
                    const index = relationships.findIndex(
                        (rel) => rel.id === id
                    );
                    if (index === -1) return;
                    relationships[index] = {
                        ...relationships[index],
                        ...attributes,
                    };
                    diagram.relationships = relationships;
                    await saveDiagram(diagram);
                });
            },
            [
                enqueueDiagramTask,
                getFullDiagram,
                resolveDiagramIdForEntity,
                saveDiagram,
            ]
        );

    const deleteRelationship: StorageContext['deleteRelationship'] =
        useCallback(
            async ({ id, diagramId }) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram?.relationships) return;
                    diagram.relationships = diagram.relationships.filter(
                        (rel) => rel.id !== id
                    );
                    relationshipIndexRef.current.delete(id);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, saveDiagram]
        );

    const listRelationships: StorageContext['listRelationships'] = useCallback(
        async (diagramId) => {
            const diagram = await getFullDiagram(diagramId);
            return (diagram?.relationships ?? []).sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        },
        [getFullDiagram]
    );

    const addDependency: StorageContext['addDependency'] = useCallback(
        async ({ diagramId, dependency }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const dependencies = diagram.dependencies ?? [];
                diagram.dependencies = [...dependencies, dependency];
                dependencyIndexRef.current.set(dependency.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const getDependency: StorageContext['getDependency'] = useCallback(
        async ({ diagramId, id }) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.dependencies?.find(
                (dependency) => dependency.id === id
            );
        },
        [getFullDiagram]
    );

    const updateDependency: StorageContext['updateDependency'] = useCallback(
        async ({ id, attributes }) => {
            const diagramId = resolveDiagramIdForEntity(
                id,
                dependencyIndexRef.current,
                'dependencies'
            );
            if (!diagramId) return;

            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.dependencies) return;
                const dependencies = [...diagram.dependencies];
                const index = dependencies.findIndex(
                    (dependency) => dependency.id === id
                );
                if (index === -1) return;
                dependencies[index] = { ...dependencies[index], ...attributes };
                diagram.dependencies = dependencies;
                await saveDiagram(diagram);
            });
        },
        [
            enqueueDiagramTask,
            getFullDiagram,
            resolveDiagramIdForEntity,
            saveDiagram,
        ]
    );

    const deleteDependency: StorageContext['deleteDependency'] = useCallback(
        async ({ diagramId, id }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.dependencies) return;
                diagram.dependencies = diagram.dependencies.filter(
                    (dependency) => dependency.id !== id
                );
                dependencyIndexRef.current.delete(id);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const listDependencies: StorageContext['listDependencies'] = useCallback(
        async (diagramId) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.dependencies ?? [];
        },
        [getFullDiagram]
    );

    const deleteDiagramDependencies: StorageContext['deleteDiagramDependencies'] =
        useCallback(
            async (diagramId) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram) return;
                    diagram.dependencies = [];
                    indexDiagram(diagram);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, indexDiagram, saveDiagram]
        );

    const addArea: StorageContext['addArea'] = useCallback(
        async ({ area, diagramId }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const areas = diagram.areas ?? [];
                diagram.areas = [...areas, area];
                areaIndexRef.current.set(area.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const getArea: StorageContext['getArea'] = useCallback(
        async ({ diagramId, id }) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.areas?.find((area) => area.id === id);
        },
        [getFullDiagram]
    );

    const updateArea: StorageContext['updateArea'] = useCallback(
        async ({ id, attributes }) => {
            const diagramId = resolveDiagramIdForEntity(
                id,
                areaIndexRef.current,
                'areas'
            );
            if (!diagramId) return;

            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.areas) return;
                const areas = [...diagram.areas];
                const index = areas.findIndex((area) => area.id === id);
                if (index === -1) return;
                areas[index] = { ...areas[index], ...attributes };
                diagram.areas = areas;
                await saveDiagram(diagram);
            });
        },
        [
            enqueueDiagramTask,
            getFullDiagram,
            resolveDiagramIdForEntity,
            saveDiagram,
        ]
    );

    const deleteArea: StorageContext['deleteArea'] = useCallback(
        async ({ diagramId, id }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.areas) return;
                diagram.areas = diagram.areas.filter((area) => area.id !== id);
                areaIndexRef.current.delete(id);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const listAreas: StorageContext['listAreas'] = useCallback(
        async (diagramId) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.areas ?? [];
        },
        [getFullDiagram]
    );

    const deleteDiagramAreas: StorageContext['deleteDiagramAreas'] =
        useCallback(
            async (diagramId) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram) return;
                    diagram.areas = [];
                    indexDiagram(diagram);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, indexDiagram, saveDiagram]
        );

    const addCustomType: StorageContext['addCustomType'] = useCallback(
        async ({ diagramId, customType }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const customTypes = diagram.customTypes ?? [];
                diagram.customTypes = [...customTypes, customType];
                customTypeIndexRef.current.set(customType.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const getCustomType: StorageContext['getCustomType'] = useCallback(
        async ({ diagramId, id }) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.customTypes?.find(
                (customType) => customType.id === id
            );
        },
        [getFullDiagram]
    );

    const updateCustomType: StorageContext['updateCustomType'] = useCallback(
        async ({ id, attributes }) => {
            const diagramId = resolveDiagramIdForEntity(
                id,
                customTypeIndexRef.current,
                'customTypes'
            );
            if (!diagramId) return;

            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.customTypes) return;
                const customTypes = [...diagram.customTypes];
                const index = customTypes.findIndex(
                    (customType) => customType.id === id
                );
                if (index === -1) return;
                customTypes[index] = { ...customTypes[index], ...attributes };
                diagram.customTypes = customTypes;
                await saveDiagram(diagram);
            });
        },
        [
            enqueueDiagramTask,
            getFullDiagram,
            resolveDiagramIdForEntity,
            saveDiagram,
        ]
    );

    const deleteCustomType: StorageContext['deleteCustomType'] = useCallback(
        async ({ diagramId, id }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.customTypes) return;
                diagram.customTypes = diagram.customTypes.filter(
                    (customType) => customType.id !== id
                );
                customTypeIndexRef.current.delete(id);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const listCustomTypes: StorageContext['listCustomTypes'] = useCallback(
        async (diagramId) => {
            const diagram = await getFullDiagram(diagramId);
            return (diagram?.customTypes ?? []).sort((a, b) =>
                a.name.localeCompare(b.name)
            );
        },
        [getFullDiagram]
    );

    const deleteDiagramCustomTypes: StorageContext['deleteDiagramCustomTypes'] =
        useCallback(
            async (diagramId) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram) return;
                    diagram.customTypes = [];
                    indexDiagram(diagram);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, indexDiagram, saveDiagram]
        );

    const addNote: StorageContext['addNote'] = useCallback(
        async ({ note, diagramId }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram) return;
                const notes = diagram.notes ?? [];
                diagram.notes = [...notes, note];
                noteIndexRef.current.set(note.id, diagramId);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const getNote: StorageContext['getNote'] = useCallback(
        async ({ diagramId, id }) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.notes?.find((note) => note.id === id);
        },
        [getFullDiagram]
    );

    const updateNote: StorageContext['updateNote'] = useCallback(
        async ({ id, attributes }) => {
            const diagramId = resolveDiagramIdForEntity(
                id,
                noteIndexRef.current,
                'notes'
            );
            if (!diagramId) return;

            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.notes) return;
                const notes = [...diagram.notes];
                const index = notes.findIndex((note) => note.id === id);
                if (index === -1) return;
                notes[index] = { ...notes[index], ...attributes };
                diagram.notes = notes;
                await saveDiagram(diagram);
            });
        },
        [
            enqueueDiagramTask,
            getFullDiagram,
            resolveDiagramIdForEntity,
            saveDiagram,
        ]
    );

    const deleteNote: StorageContext['deleteNote'] = useCallback(
        async ({ diagramId, id }) => {
            await enqueueDiagramTask(diagramId, async () => {
                if (deletedDiagramsRef.current.has(diagramId)) return;
                const diagram = await getFullDiagram(diagramId);
                if (!diagram?.notes) return;
                diagram.notes = diagram.notes.filter((note) => note.id !== id);
                noteIndexRef.current.delete(id);
                await saveDiagram(diagram);
            });
        },
        [enqueueDiagramTask, getFullDiagram, saveDiagram]
    );

    const listNotes: StorageContext['listNotes'] = useCallback(
        async (diagramId) => {
            const diagram = await getFullDiagram(diagramId);
            return diagram?.notes ?? [];
        },
        [getFullDiagram]
    );

    const deleteDiagramNotes: StorageContext['deleteDiagramNotes'] =
        useCallback(
            async (diagramId) => {
                await enqueueDiagramTask(diagramId, async () => {
                    if (deletedDiagramsRef.current.has(diagramId)) return;
                    const diagram = await getFullDiagram(diagramId);
                    if (!diagram) return;
                    diagram.notes = [];
                    indexDiagram(diagram);
                    await saveDiagram(diagram);
                });
            },
            [enqueueDiagramTask, getFullDiagram, indexDiagram, saveDiagram]
        );

    return (
        <storageContext.Provider
            value={{
                getConfig,
                updateConfig,
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
                addRelationship,
                getRelationship,
                updateRelationship,
                deleteRelationship,
                listRelationships,
                deleteDiagramTables,
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
                addNote,
                getNote,
                updateNote,
                deleteNote,
                listNotes,
                deleteDiagramNotes,
                getDiagramFilter,
                updateDiagramFilter,
                deleteDiagramFilter,
            }}
        >
            {children}
        </storageContext.Provider>
    );
};
