import { z } from 'zod';

export const auditLogActions = [
    'user.create',
    'user.update',
    'user.password.reset',
    'user.deactivate',
    'user.reactivate',
    'auth.login',
    'diagram.share.add',
    'diagram.share.update',
    'diagram.share.remove',
    'diagram.visibility.update',
] as const;

export type AuditLogAction = (typeof auditLogActions)[number];

export interface AuditLogEntry {
    id: string;
    action: AuditLogAction;
    actorId: string;
    createdAt: Date;
    targetId?: string;
    targetType?: 'user' | 'diagram' | 'system';
    metadata?: Record<string, unknown>;
}

export const auditLogEntrySchema: z.ZodType<AuditLogEntry> = z.object({
    id: z.string(),
    action: z.enum(auditLogActions),
    actorId: z.string(),
    createdAt: z.date(),
    targetId: z.string().optional(),
    targetType: z.enum(['user', 'diagram', 'system']).optional(),
    metadata: z.record(z.any()).optional(),
});
