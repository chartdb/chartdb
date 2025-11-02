import { z } from 'zod';

export const collaboratorRoles = ['viewer', 'editor'] as const;
export type CollaboratorRole = (typeof collaboratorRoles)[number];

export interface DiagramCollaborator {
    id: string;
    diagramId: string;
    userId: string;
    role: CollaboratorRole;
    canInvite: boolean;
    invitedBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export const diagramCollaboratorSchema: z.ZodType<DiagramCollaborator> =
    z.object({
        id: z.string(),
        diagramId: z.string(),
        userId: z.string(),
        role: z.enum(collaboratorRoles),
        canInvite: z.boolean(),
        invitedBy: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
    });

export const canCollaboratorInvite = (
    collaborator: DiagramCollaborator,
    diagramAllowEditorsToInvite: boolean
): boolean =>
    collaborator.role === 'editor' && diagramAllowEditorsToInvite
        ? true
        : collaborator.canInvite;
