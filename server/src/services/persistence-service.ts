import type { AppRepository } from '../repositories/app-repository.js';
import {
    type AppUserRecord,
    type DiagramRecord,
    type ProjectRecord,
} from '../repositories/app-repository.js';
import {
    createProjectSchema,
    diagramDocumentSchema,
    type DiagramDocument,
    listProjectDiagramsQuerySchema,
    upsertDiagramSchema,
    updateProjectSchema,
} from '../schemas/persistence.js';
import { AppError } from '../utils/app-error.js';
import { generateId } from '../utils/id.js';

export interface BootstrapResult {
    user: AppUserRecord;
    defaultProject: ProjectRecord;
}

const DEFAULT_USER_CONFIG_KEY = 'default_user_id';
const DEFAULT_PROJECT_CONFIG_KEY = 'default_project_id';

export class PersistenceService {
    constructor(
        private readonly repository: AppRepository,
        private readonly defaults: {
            defaultOwnerName: string;
            defaultProjectName: string;
        }
    ) {}

    bootstrap(): BootstrapResult {
        const now = new Date().toISOString();
        let userId = this.repository.getConfigValue(DEFAULT_USER_CONFIG_KEY);
        let projectId = this.repository.getConfigValue(
            DEFAULT_PROJECT_CONFIG_KEY
        );

        if (!userId) {
            userId = generateId();
            this.repository.setConfigValue(DEFAULT_USER_CONFIG_KEY, userId);
        }

        let user = this.repository.getUser(userId);
        if (!user) {
            user = {
                id: userId,
                email: null,
                displayName: this.defaults.defaultOwnerName,
                authProvider: 'placeholder',
                status: 'provisioned',
                ownershipScope: 'personal',
                createdAt: now,
                updatedAt: now,
            };
            this.repository.putUser(user);
        }

        if (!projectId) {
            projectId = generateId();
            this.repository.setConfigValue(
                DEFAULT_PROJECT_CONFIG_KEY,
                projectId
            );
        }

        let defaultProject = this.repository.getProject(projectId);
        if (!defaultProject) {
            defaultProject = {
                id: projectId,
                name: this.defaults.defaultProjectName,
                description: 'Default self-hosted ChartDB project',
                ownerUserId: user.id,
                visibility: 'private',
                status: 'active',
                createdAt: now,
                updatedAt: now,
            };
            this.repository.putProject(defaultProject);
        }

        return { user, defaultProject };
    }

    listProjects(options?: {
        search?: string;
    }): Array<ProjectRecord & { diagramCount: number }> {
        const searchTerm = options?.search?.trim().toLowerCase();
        return this.repository
            .listProjects()
            .filter((project) =>
                searchTerm
                    ? project.name.toLowerCase().includes(searchTerm) ||
                      (project.description ?? '')
                          .toLowerCase()
                          .includes(searchTerm)
                    : true
            )
            .map((project) => ({
                ...project,
                diagramCount: this.repository.listProjectDiagrams(project.id)
                    .length,
            }));
    }

    createProject(input: unknown): ProjectRecord {
        const payload = createProjectSchema.parse(input);
        const bootstrap = this.bootstrap();
        const now = new Date().toISOString();
        const project: ProjectRecord = {
            id: generateId(),
            name: payload.name,
            description: payload.description ?? null,
            ownerUserId: bootstrap.user.id,
            visibility: payload.visibility ?? 'private',
            status: payload.status ?? 'active',
            createdAt: now,
            updatedAt: now,
        };
        this.repository.putProject(project);
        return project;
    }

    updateProject(projectId: string, input: unknown): ProjectRecord {
        const project = this.repository.getProject(projectId);
        if (!project) {
            throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
        }

        const payload = updateProjectSchema.parse(input);
        const updatedProject: ProjectRecord = {
            ...project,
            name: payload.name ?? project.name,
            description:
                payload.description !== undefined
                    ? (payload.description ?? null)
                    : project.description,
            visibility: payload.visibility ?? project.visibility,
            status: payload.status ?? project.status,
            updatedAt: new Date().toISOString(),
        };
        this.repository.putProject(updatedProject);
        return updatedProject;
    }

    deleteProject(projectId: string) {
        const project = this.repository.getProject(projectId);
        if (!project) {
            throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
        }
        this.repository.deleteProject(projectId);
    }

    listProjectDiagrams(projectId: string, query: unknown) {
        const project = this.repository.getProject(projectId);
        if (!project) {
            throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
        }

        const options = listProjectDiagramsQuerySchema.parse(query ?? {});
        const searchTerm = options.search?.trim().toLowerCase();
        const diagrams = this.repository
            .listProjectDiagrams(projectId)
            .filter((diagram) =>
                searchTerm
                    ? diagram.name.toLowerCase().includes(searchTerm) ||
                      (diagram.description ?? '')
                          .toLowerCase()
                          .includes(searchTerm)
                    : true
            );

        if (options.view === 'full') {
            return diagrams.map((diagram) => this.toDiagramResponse(diagram));
        }

        return diagrams.map((diagram) => ({
            id: diagram.id,
            projectId: diagram.projectId,
            ownerUserId: diagram.ownerUserId,
            name: diagram.name,
            description: diagram.description,
            databaseType: diagram.databaseType,
            databaseEdition: diagram.databaseEdition,
            visibility: diagram.visibility,
            status: diagram.status,
            tableCount: Array.isArray(diagram.document.tables)
                ? diagram.document.tables.length
                : 0,
            createdAt: diagram.createdAt,
            updatedAt: diagram.updatedAt,
        }));
    }

    getDiagram(diagramId: string) {
        const diagram = this.repository.getDiagram(diagramId);
        if (!diagram) {
            throw new AppError('Diagram not found.', 404, 'DIAGRAM_NOT_FOUND');
        }
        return this.toDiagramResponse(diagram);
    }

    upsertDiagram(diagramId: string, input: unknown) {
        const payload = upsertDiagramSchema.parse(input);
        const project = this.repository.getProject(payload.projectId);
        if (!project) {
            throw new AppError('Project not found.', 404, 'PROJECT_NOT_FOUND');
        }

        const document = diagramDocumentSchema.parse({
            ...payload.diagram,
            id: diagramId,
        });
        const existing = this.repository.getDiagram(diagramId);
        const now = new Date().toISOString();

        const record: DiagramRecord = {
            id: diagramId,
            projectId: payload.projectId,
            ownerUserId:
                payload.ownerUserId ??
                existing?.ownerUserId ??
                project.ownerUserId ??
                null,
            name: document.name,
            description:
                payload.description !== undefined
                    ? (payload.description ?? null)
                    : (existing?.description ?? null),
            databaseType: document.databaseType,
            databaseEdition: document.databaseEdition ?? null,
            visibility: payload.visibility ?? existing?.visibility ?? 'private',
            status: payload.status ?? existing?.status ?? 'active',
            document: this.normalizeDocument({
                ...document,
                createdAt: existing?.document.createdAt ?? document.createdAt,
                updatedAt: document.updatedAt,
            }),
            createdAt: existing?.createdAt ?? now,
            updatedAt: now,
        };

        this.repository.putDiagram(record);
        return this.toDiagramResponse(record);
    }

    deleteDiagram(diagramId: string) {
        const diagram = this.repository.getDiagram(diagramId);
        if (!diagram) {
            throw new AppError('Diagram not found.', 404, 'DIAGRAM_NOT_FOUND');
        }
        this.repository.deleteDiagram(diagramId);
    }

    private normalizeDocument(document: DiagramDocument): DiagramDocument {
        return {
            ...document,
            createdAt: new Date(document.createdAt),
            updatedAt: new Date(document.updatedAt),
        };
    }

    private toDiagramResponse(diagram: DiagramRecord) {
        return {
            id: diagram.id,
            projectId: diagram.projectId,
            ownerUserId: diagram.ownerUserId,
            name: diagram.name,
            description: diagram.description,
            databaseType: diagram.databaseType,
            databaseEdition: diagram.databaseEdition,
            visibility: diagram.visibility,
            status: diagram.status,
            createdAt: diagram.createdAt,
            updatedAt: diagram.updatedAt,
            diagram: {
                ...diagram.document,
                createdAt: diagram.document.createdAt.toISOString(),
                updatedAt: diagram.document.updatedAt.toISOString(),
            },
        };
    }
}
