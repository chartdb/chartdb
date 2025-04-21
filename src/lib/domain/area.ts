import { z } from 'zod';

export interface Area {
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
    order?: number;
}

export const areaSchema: z.ZodType<Area> = z.object({
    id: z.string(),
    name: z.string(),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    color: z.string(),
    order: z.number().optional(),
});
