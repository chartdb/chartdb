import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { collabContext, type CollabContextType } from './collab-context';
import { Collab } from '@/lib/collab/collab';
import type { CollabCallbacks } from '@/lib/collab/collab';
import type {
    Collaborator,
    CollabScene,
    RoomLinkData,
} from '@/lib/collab/types';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getCollaborationLinkData } from '@/lib/collab/types';
import { useChartDB } from '@/hooks/use-chartdb';

export const CollabProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const {
        tables,
        relationships,
        dependencies,
        areas,
        notes,
        customTypes,
        currentDiagram,
        addTables,
        addRelationships,
        addDependencies,
        addAreas,
        addNotes,
        addCustomTypes,
        removeTables,
        removeRelationships,
        removeDependencies,
        removeAreas,
        removeNotes,
        removeCustomTypes,
        updateTable,
        updateRelationship,
        updateDependency,
        updateArea,
        updateNote,
        updateCustomType,
        loadDiagramFromData,
    } = useChartDB();

    const [isCollaborating, setIsCollaborating] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [collaborators, setCollaborators] = useState<
        Map<string, Collaborator>
    >(new Map());
    const [username, setUsernameState] = useState('Anonymous');

    const tablesRef = useRef(tables);
    const relationshipsRef = useRef(relationships);
    const dependenciesRef = useRef(dependencies);
    const areasRef = useRef(areas);
    const notesRef = useRef(notes);
    const customTypesRef = useRef(customTypes);
    const currentDiagramRef = useRef(currentDiagram);

    // Keep refs in sync
    useEffect(() => {
        tablesRef.current = tables;
    }, [tables]);
    useEffect(() => {
        relationshipsRef.current = relationships;
    }, [relationships]);
    useEffect(() => {
        dependenciesRef.current = dependencies;
    }, [dependencies]);
    useEffect(() => {
        areasRef.current = areas;
    }, [areas]);
    useEffect(() => {
        notesRef.current = notes;
    }, [notes]);
    useEffect(() => {
        customTypesRef.current = customTypes;
    }, [customTypes]);
    useEffect(() => {
        currentDiagramRef.current = currentDiagram;
    }, [currentDiagram]);

    const collabRef = useRef<Collab | null>(null);

    const getCollab = useCallback((): Collab => {
        if (!collabRef.current) {
            const callbacks: CollabCallbacks = {
                getDiagram: () => currentDiagramRef.current,
                getTables: () => tablesRef.current,
                getRelationships: () => relationshipsRef.current,
                getDependencies: () => dependenciesRef.current,
                getAreas: () => areasRef.current,
                getNotes: () => notesRef.current,
                getCustomTypes: () => customTypesRef.current,

                loadScene: (scene: CollabScene) => {
                    // Apply full scene from remote
                    const diagram = {
                        ...currentDiagramRef.current,
                        name: scene.meta.diagramName,
                        databaseType: scene.meta.databaseType,
                        databaseEdition: scene.meta.databaseEdition,
                        tables: scene.tables.map(stripSyncMetadata),
                        relationships:
                            scene.relationships.map(stripSyncMetadata),
                        dependencies: scene.dependencies.map(stripSyncMetadata),
                        areas: scene.areas.map(stripSyncMetadata),
                        notes: scene.notes.map(stripSyncMetadata),
                        customTypes: scene.customTypes.map(stripSyncMetadata),
                    };
                    loadDiagramFromData(diagram);
                },

                applyUpdate: (update: Partial<CollabScene>) => {
                    // Apply incremental updates from remote
                    // Using { updateHistory: false } to avoid polluting undo stack
                    if (update.tables) {
                        applyEntityUpdates(
                            'tables',
                            update.tables,
                            tablesRef.current
                        );
                    }
                    if (update.relationships) {
                        applyEntityUpdates(
                            'relationships',
                            update.relationships,
                            relationshipsRef.current
                        );
                    }
                    if (update.dependencies) {
                        applyEntityUpdates(
                            'dependencies',
                            update.dependencies,
                            dependenciesRef.current
                        );
                    }
                    if (update.areas) {
                        applyEntityUpdates(
                            'areas',
                            update.areas,
                            areasRef.current
                        );
                    }
                    if (update.notes) {
                        applyEntityUpdates(
                            'notes',
                            update.notes,
                            notesRef.current
                        );
                    }
                    if (update.customTypes) {
                        applyEntityUpdates(
                            'customTypes',
                            update.customTypes,
                            customTypesRef.current
                        );
                    }
                },

                onCollaboratorsChange: (
                    newCollaborators: Map<string, Collaborator>
                ) => {
                    setCollaborators(newCollaborators);
                },

                onConnectionChange: (connected: boolean) => {
                    setIsConnected(connected);
                },
            };
            collabRef.current = new Collab(callbacks);
        }
        return collabRef.current;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const applyEntityUpdates = useCallback(
        (
            type: string,
            remoteEntities: Array<{ id: string; isDeleted?: boolean }>,
            localEntities: { id: string }[]
        ) => {
            const localIds = new Set(localEntities.map((e) => e.id));
            const noHistory = { updateHistory: false };

            for (const remote of remoteEntities) {
                const stripped: any = stripSyncMetadata(remote);
                const isDeleted = remote.isDeleted;

                if (isDeleted) {
                    if (localIds.has(remote.id)) {
                        switch (type) {
                            case 'tables':
                                removeTables([remote.id], noHistory);
                                break;
                            case 'relationships':
                                removeRelationships([remote.id], noHistory);
                                break;
                            case 'dependencies':
                                removeDependencies([remote.id], noHistory);
                                break;
                            case 'areas':
                                removeAreas([remote.id], noHistory);
                                break;
                            case 'notes':
                                removeNotes([remote.id], noHistory);
                                break;
                            case 'customTypes':
                                removeCustomTypes([remote.id], noHistory);
                                break;
                        }
                    }
                } else if (localIds.has(remote.id)) {
                    // Update existing entity
                    switch (type) {
                        case 'tables':
                            updateTable(remote.id, stripped, noHistory);
                            break;
                        case 'relationships':
                            updateRelationship(remote.id, stripped, noHistory);
                            break;
                        case 'dependencies':
                            updateDependency(remote.id, stripped, noHistory);
                            break;
                        case 'areas':
                            updateArea(remote.id, stripped, noHistory);
                            break;
                        case 'notes':
                            updateNote(remote.id, stripped, noHistory);
                            break;
                        case 'customTypes':
                            updateCustomType(remote.id, stripped, noHistory);
                            break;
                    }
                } else {
                    // Add new entity
                    switch (type) {
                        case 'tables':
                            addTables([stripped], noHistory);
                            break;
                        case 'relationships':
                            addRelationships([stripped], noHistory);
                            break;
                        case 'dependencies':
                            addDependencies([stripped], noHistory);
                            break;
                        case 'areas':
                            addAreas([stripped], noHistory);
                            break;
                        case 'notes':
                            addNotes([stripped], noHistory);
                            break;
                        case 'customTypes':
                            addCustomTypes([stripped], noHistory);
                            break;
                    }
                }
            }
        },
        [
            addTables,
            addRelationships,
            addDependencies,
            addAreas,
            addNotes,
            addCustomTypes,
            removeTables,
            removeRelationships,
            removeDependencies,
            removeAreas,
            removeNotes,
            removeCustomTypes,
            updateTable,
            updateRelationship,
            updateDependency,
            updateArea,
            updateNote,
            updateCustomType,
        ]
    );

    // Sync local changes to collab
    const prevTablesRef = useRef(tables);
    const prevRelationshipsRef = useRef(relationships);
    const prevDependenciesRef = useRef(dependencies);
    const prevAreasRef = useRef(areas);
    const prevNotesRef = useRef(notes);
    const prevCustomTypesRef = useRef(customTypes);

    useEffect(() => {
        if (!isCollaborating) return;
        const collab = getCollab();

        const hasChanges =
            prevTablesRef.current !== tables ||
            prevRelationshipsRef.current !== relationships ||
            prevDependenciesRef.current !== dependencies ||
            prevAreasRef.current !== areas ||
            prevNotesRef.current !== notes ||
            prevCustomTypesRef.current !== customTypes;

        if (hasChanges) {
            prevTablesRef.current = tables;
            prevRelationshipsRef.current = relationships;
            prevDependenciesRef.current = dependencies;
            prevAreasRef.current = areas;
            prevNotesRef.current = notes;
            prevCustomTypesRef.current = customTypes;
            collab.syncElements();
        }
    }, [
        tables,
        relationships,
        dependencies,
        areas,
        notes,
        customTypes,
        isCollaborating,
        getCollab,
    ]);

    // Auto-join room from URL hash on mount
    useEffect(() => {
        const roomLinkData = getCollaborationLinkData(window.location.href);
        if (roomLinkData) {
            startCollaboration(roomLinkData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            collabRef.current?.destroy();
        };
    }, []);

    const startCollaboration = useCallback(
        async (roomLinkData?: RoomLinkData): Promise<string> => {
            const collab = getCollab();
            setIsCollaborating(true);
            const link = await collab.startCollaboration(roomLinkData);
            return link;
        },
        [getCollab]
    );

    const stopCollaboration = useCallback(
        (keepRemoteState = false) => {
            const collab = getCollab();
            collab.stopCollaboration(keepRemoteState);
            setIsCollaborating(false);
            setIsConnected(false);
            setCollaborators(new Map());
        },
        [getCollab]
    );

    const onPointerUpdate = useCallback(
        (pointer: { x: number; y: number }) => {
            const collab = getCollab();
            collab.onPointerUpdate(pointer);
        },
        [getCollab]
    );

    const getShareableLink = useCallback((): string | null => {
        const collab = getCollab();
        return collab.getShareableLink();
    }, [getCollab]);

    const setUsername = useCallback(
        (name: string) => {
            setUsernameState(name);
            const collab = getCollab();
            collab.setUsername(name);
        },
        [getCollab]
    );

    const value: CollabContextType = useMemo(
        () => ({
            isCollaborating,
            isConnected,
            collaborators,
            startCollaboration,
            stopCollaboration,
            onPointerUpdate,
            getShareableLink,
            setUsername,
            username,
        }),
        [
            isCollaborating,
            isConnected,
            collaborators,
            startCollaboration,
            stopCollaboration,
            onPointerUpdate,
            getShareableLink,
            setUsername,
            username,
        ]
    );

    return (
        <collabContext.Provider value={value}>
            {children}
        </collabContext.Provider>
    );
};

// Helper to strip sync metadata from entities before applying to ChartDB
function stripSyncMetadata<T>(entity: T): T {
    if (!entity || typeof entity !== 'object') return entity;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { version, versionNonce, isDeleted, ...rest } = entity as Record<
        string,
        unknown
    >;
    return rest as T;
}
