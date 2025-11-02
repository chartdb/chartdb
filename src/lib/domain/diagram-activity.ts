import { z } from 'zod';

export const diagramActivityTypes = [
    'diagram.updated',
    'diagram.shared',
    'diagram.unshared',
    'diagram.accessed',
] as const;

export type DiagramActivityType = (typeof diagramActivityTypes)[number];

export interface DiagramActivity {
    id: string;
    diagramId: string;
    userId?: string;
    type: DiagramActivityType;
    createdAt: Date;
    metadata?: Record<string, unknown>;
}

export const diagramActivitySchema: z.ZodType<DiagramActivity> = z.object({
    id: z.string(),
    diagramId: z.string(),
    userId: z.string().optional(),
    type: z.enum(diagramActivityTypes),
    createdAt: z.date(),
    metadata: z.record(z.any()).optional(),
});
