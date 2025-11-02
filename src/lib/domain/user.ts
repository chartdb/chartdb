import { z } from 'zod';

export const userRoles = ['admin', 'user'] as const;
export type UserRole = (typeof userRoles)[number];

export interface User {
    id: string;
    username: string;
    displayName: string;
    passwordHash: string;
    role: UserRole;
    active: boolean;
    mustChangePassword: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
}

export const userSchema: z.ZodType<User> = z.object({
    id: z.string(),
    username: z.string().min(3),
    displayName: z.string().min(1),
    passwordHash: z.string().min(1),
    role: z.enum(userRoles),
    active: z.boolean(),
    mustChangePassword: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
    lastLoginAt: z.date().optional(),
});

export const sanitizeUsername = (username: string): string =>
    username.trim().toLowerCase();

export type PublicUser = Pick<
    User,
    | 'id'
    | 'username'
    | 'displayName'
    | 'role'
    | 'active'
    | 'mustChangePassword'
    | 'lastLoginAt'
>;
