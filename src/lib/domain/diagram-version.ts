import { z } from 'zod';

export interface DiagramVersion {
    id: string;
    diagramId: string;
    version: number;
    name: string;
    createdAt: Date;
    createdBy?: string;
    snapshot: string;
}

export const diagramVersionSchema: z.ZodType<DiagramVersion> = z.object({
    id: z.string(),
    diagramId: z.string(),
    version: z.number(),
    name: z.string(),
    createdAt: z.date(),
    createdBy: z.string().optional(),
    snapshot: z.string(),
});
