import { z } from 'zod';

export interface ViewInfo {
    schema: string;
    view_name: string;
    view_definition?: string;
}

export const ViewInfoSchema: z.ZodType<ViewInfo> = z.object({
    schema: z.string(),
    view_name: z.string(),
    view_definition: z.string().optional(),
});
