import { requestJson } from '@/lib/api/request';
import type { Diagram } from '@/lib/domain/diagram';

export interface PersistedUserSummary {
    id: string;
    email: string | null;
    displayName: string;
    authProvider: 'placeholder' | 'local' | 'oidc';
    status: 'provisioned' | 'active' | 'disabled';
    ownershipScope: 'personal' | 'workspace';
    createdAt: string;
    updatedAt: string;
}

export interface PersistedProjectSummary {
    id: string;
    name: string;
    description: string | null;
    ownerUserId: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'active' | 'archived' | 'deleted';
    createdAt: string;
    updatedAt: string;
}

export type DiagramDto = Omit<Diagram, 'createdAt' | 'updatedAt'> & {
    createdAt: string;
    updatedAt: string;
};

export interface PersistedDiagramSummary {
    id: string;
    projectId: string;
    ownerUserId: string | null;
    name: string;
    description: string | null;
    databaseType: string;
    databaseEdition: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'draft' | 'active' | 'archived';
    tableCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PersistedDiagramRecord {
    id: string;
    projectId: string;
    ownerUserId: string | null;
    name: string;
    description: string | null;
    databaseType: string;
    databaseEdition: string | null;
    visibility: 'private' | 'workspace' | 'public';
    status: 'draft' | 'active' | 'archived';
    createdAt: string;
    updatedAt: string;
    diagram: DiagramDto;
}

export interface BootstrapResponse {
    user: PersistedUserSummary;
    defaultProject: PersistedProjectSummary;
}

export const serializeDiagram = (diagram: Diagram): DiagramDto => ({
    ...diagram,
    createdAt: diagram.createdAt.toISOString(),
    updatedAt: diagram.updatedAt.toISOString(),
});

export const deserializeDiagram = (diagram: DiagramDto): Diagram => ({
    ...diagram,
    createdAt: new Date(diagram.createdAt),
    updatedAt: new Date(diagram.updatedAt),
});

export const persistenceClient = {
    bootstrap: async () => requestJson<BootstrapResponse>('/api/app/bootstrap'),
    listProjectDiagrams: async (
        projectId: string,
        options?: { view?: 'summary' | 'full'; search?: string }
    ) => {
        const params = new URLSearchParams();
        if (options?.view) {
            params.set('view', options.view);
        }
        if (options?.search) {
            params.set('search', options.search);
        }

        return requestJson<{
            items: Array<PersistedDiagramSummary | PersistedDiagramRecord>;
        }>(
            `/api/projects/${projectId}/diagrams${
                params.size > 0 ? `?${params.toString()}` : ''
            }`
        );
    },
    getDiagram: async (diagramId: string) =>
        requestJson<PersistedDiagramRecord>(`/api/diagrams/${diagramId}`),
    upsertDiagram: async (
        diagramId: string,
        payload: {
            projectId: string;
            ownerUserId?: string;
            visibility?: 'private' | 'workspace' | 'public';
            status?: 'draft' | 'active' | 'archived';
            description?: string;
            diagram: DiagramDto;
        }
    ) =>
        requestJson<{ diagram: PersistedDiagramRecord }>(
            `/api/diagrams/${diagramId}`,
            {
                method: 'PUT',
                body: JSON.stringify(payload),
            }
        ),
    deleteDiagram: async (diagramId: string) =>
        requestJson<{ ok: boolean }>(`/api/diagrams/${diagramId}`, {
            method: 'DELETE',
        }),
};
