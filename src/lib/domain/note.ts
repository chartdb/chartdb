import { z } from 'zod';

export interface Note {
    id: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    order?: number;
}

export const noteSchema: z.ZodType<Note> = z.object({
    id: z.string(),
    content: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
    order: z.number().optional(),
});
