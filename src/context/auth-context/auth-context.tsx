/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { useStorage } from '@/hooks/use-storage';
import type { User, PublicUser } from '@/lib/domain/user';
import type { AuditLogEntry } from '@/lib/domain/audit-log';
import type { DiagramVersion } from '@/lib/domain/diagram-version';
import type { DiagramActivity } from '@/lib/domain/diagram-activity';
import { verifyPassword, hashPassword } from '@/lib/crypto';
import { generateId } from '@/lib/utils';

const SESSION_KEY = 'chartdb.session';
const TEMP_SESSION_KEY = 'chartdb.session.temp';

interface StoredSession {
    userId: string;
    remember: boolean;
}

export interface SessionUser extends PublicUser {
    displayName: string;
    role: User['role'];
}

export interface AuthContextValue {
    currentUser?: SessionUser;
    isLoading: boolean;
    mustChangePassword: boolean;
    login: (
        username: string,
        password: string,
        options?: { remember?: boolean }
    ) => Promise<void>;
    logout: () => Promise<void>;
    changePassword: (
        currentPassword: string,
        newPassword: string
    ) => Promise<void>;
    completeForcedPasswordChange: (newPassword: string) => Promise<void>;
    listUsers: () => Promise<SessionUser[]>;
    createUser: (params: {
        username: string;
        displayName: string;
        role: User['role'];
        password?: string;
        mustChangePassword?: boolean;
    }) => Promise<{ user: SessionUser; password: string }>;
    updateUser: (
        id: string,
        attributes: Partial<Pick<User, 'username' | 'displayName' | 'role'>>
    ) => Promise<void>;
    resetUserPassword: (id: string) => Promise<string>;
    setUserStatus: (id: string, active: boolean) => Promise<void>;
    listAuditLogs: () => Promise<AuditLogEntry[]>;
    listDiagramVersions: (diagramId: string) => Promise<DiagramVersion[]>;
    listDiagramActivity: (diagramId: string) => Promise<DiagramActivity[]>;
    generatePassword: (length?: number) => string;
    getUserById: (id: string) => Promise<SessionUser | undefined>;
}

const initialContext: AuthContextValue = {
    currentUser: undefined,
    isLoading: true,
    mustChangePassword: false,
    login: async () => {},
    logout: async () => {},
    changePassword: async () => {},
    completeForcedPasswordChange: async () => {},
    listUsers: async () => [],
    createUser: async () => {
        throw new Error('Not implemented');
    },
    updateUser: async () => {},
    resetUserPassword: async () => '',
    setUserStatus: async () => {},
    listAuditLogs: async () => [],
    listDiagramVersions: async () => [],
    listDiagramActivity: async () => [],
    generatePassword: () => '',
    getUserById: async () => undefined,
};

export const authContext = createContext<AuthContextValue>(initialContext);

const readStoredSession = (): StoredSession | undefined => {
    try {
        const rawTemp =
            typeof window !== 'undefined'
                ? window.sessionStorage.getItem(TEMP_SESSION_KEY)
                : null;
        if (rawTemp) {
            return JSON.parse(rawTemp) as StoredSession;
        }
        const raw =
            typeof window !== 'undefined'
                ? window.localStorage.getItem(SESSION_KEY)
                : null;
        if (raw) {
            return JSON.parse(raw) as StoredSession;
        }
    } catch (error) {
        console.error('Failed to parse stored session', error);
    }
    return undefined;
};

const persistSession = (session: StoredSession | undefined) => {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.removeItem(TEMP_SESSION_KEY);
    window.localStorage.removeItem(SESSION_KEY);

    if (!session) {
        return;
    }

    if (session.remember) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
        window.sessionStorage.setItem(
            TEMP_SESSION_KEY,
            JSON.stringify(session)
        );
    }
};

const sanitizeUser = (user: User): SessionUser => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    active: user.active,
    mustChangePassword: user.mustChangePassword,
    lastLoginAt: user.lastLoginAt,
});

const PASSWORD_CHARS =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@#$%^&*';

const generateRandomPassword = (length = 12) => {
    let password = '';
    const array = new Uint32Array(length);
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
        window.crypto.getRandomValues(array);
        for (let i = 0; i < length; i++) {
            password += PASSWORD_CHARS[array[i] % PASSWORD_CHARS.length];
        }
        return password;
    }

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * PASSWORD_CHARS.length);
        password += PASSWORD_CHARS[randomIndex];
    }
    return password;
};

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const storage = useStorage();
    const [user, setUser] = useState<User>();
    const [isLoading, setIsLoading] = useState(true);
    const [mustChangePassword, setMustChangePassword] = useState(false);

    const currentUser = useMemo(
        () => (user ? sanitizeUser(user) : undefined),
        [user]
    );

    const logAudit = useCallback(
        async (
            action: AuditLogEntry['action'],
            targetType: AuditLogEntry['targetType'],
            targetId?: string,
            metadata?: Record<string, unknown>
        ) => {
            const actorId = user?.id ?? 'system';
            await storage.addAuditLogEntry({
                id: generateId(),
                action,
                actorId,
                createdAt: new Date(),
                targetId,
                targetType,
                metadata,
            });
        },
        [storage, user?.id]
    );

    const loadSessionUser = useCallback(async () => {
        const storedSession = readStoredSession();
        if (!storedSession) {
            setIsLoading(false);
            return;
        }

        const storedUser = await storage.getUserById(storedSession.userId);
        if (storedUser && storedUser.active) {
            setUser(storedUser);
            setMustChangePassword(storedUser.mustChangePassword);
        } else {
            persistSession(undefined);
        }
        setIsLoading(false);
    }, [storage]);

    useEffect(() => {
        let cancelled = false;
        const init = async () => {
            await storage.ensureDefaultAdminUser();
            if (cancelled) return;
            await loadSessionUser();
        };
        void init();
        return () => {
            cancelled = true;
        };
    }, [loadSessionUser, storage]);

    const login: AuthContextValue['login'] = useCallback(
        async (username, password, options = {}) => {
            const record = await storage.getUserByUsername(username);
            if (!record) {
                throw new Error('Invalid username or password');
            }
            if (!record.active) {
                throw new Error('Account is deactivated');
            }

            const match = await verifyPassword(password, record.passwordHash);
            if (!match) {
                throw new Error('Invalid username or password');
            }

            await storage.touchUserLogin(record.id);
            const refreshed = await storage.getUserById(record.id);
            if (!refreshed) {
                throw new Error('User record not found');
            }

            setUser(refreshed);
            setMustChangePassword(refreshed.mustChangePassword);
            persistSession({
                userId: refreshed.id,
                remember: options.remember ?? false,
            });
            await logAudit('auth.login', 'user', refreshed.id, {
                username: refreshed.username,
            });
        },
        [logAudit, storage]
    );

    const logout = useCallback(async () => {
        setUser(undefined);
        setMustChangePassword(false);
        persistSession(undefined);
    }, []);

    const changePassword: AuthContextValue['changePassword'] = useCallback(
        async (currentPassword, newPassword) => {
            if (!user) {
                throw new Error('Not authenticated');
            }

            const record = await storage.getUserById(user.id);
            if (!record) {
                throw new Error('User not found');
            }

            const match = await verifyPassword(
                currentPassword,
                record.passwordHash
            );
            if (!match) {
                throw new Error('Current password is incorrect');
            }

            const newHash = await hashPassword(newPassword);
            await storage.setUserPassword({
                id: record.id,
                passwordHash: newHash,
                mustChangePassword: false,
            });

            const refreshed = await storage.getUserById(record.id);
            if (refreshed) {
                setUser(refreshed);
                setMustChangePassword(false);
            }
        },
        [storage, user]
    );

    const completeForcedPasswordChange: AuthContextValue['completeForcedPasswordChange'] =
        useCallback(
            async (newPassword: string) => {
                if (!user) {
                    throw new Error('Not authenticated');
                }
                const newHash = await hashPassword(newPassword);
                await storage.setUserPassword({
                    id: user.id,
                    passwordHash: newHash,
                    mustChangePassword: false,
                });
                const refreshed = await storage.getUserById(user.id);
                if (refreshed) {
                    setUser(refreshed);
                    setMustChangePassword(false);
                }
            },
            [storage, user]
        );

    const listUsers = useCallback(async () => {
        const users = await storage.listUsers();
        return users.map((u) => ({
            ...u,
            displayName: u.displayName,
            role: u.role,
        }));
    }, [storage]);

    const getUserById = useCallback(
        async (id: string) => {
            const found = await storage.getUserById(id);
            return found ? sanitizeUser(found) : undefined;
        },
        [storage]
    );

    const createUser: AuthContextValue['createUser'] = useCallback(
        async ({
            username,
            displayName,
            role,
            password,
            mustChangePassword,
        }) => {
            if (user?.role !== 'admin') {
                throw new Error('Only administrators can create users');
            }

            const passwordValue = password ?? generateRandomPassword();
            const passwordHash = await hashPassword(passwordValue);
            const created = await storage.createUser({
                username,
                displayName,
                role,
                passwordHash,
                mustChangePassword: mustChangePassword ?? true,
                active: true,
            });
            await logAudit('user.create', 'user', created.id, {
                username: created.username,
                role: created.role,
            });
            return {
                user: sanitizeUser(created),
                password: passwordValue,
            };
        },
        [logAudit, storage, user?.role]
    );

    const updateUser: AuthContextValue['updateUser'] = useCallback(
        async (id, attributes) => {
            if (user?.role !== 'admin') {
                throw new Error('Only administrators can update users');
            }
            await storage.updateUser({ id, attributes });
            await logAudit('user.update', 'user', id, attributes);
            if (user?.id === id) {
                const refreshed = await storage.getUserById(id);
                if (refreshed) {
                    setUser(refreshed);
                    setMustChangePassword(refreshed.mustChangePassword);
                }
            }
        },
        [logAudit, storage, user?.id, user?.role]
    );

    const resetUserPassword: AuthContextValue['resetUserPassword'] =
        useCallback(
            async (id: string) => {
                if (user?.role !== 'admin') {
                    throw new Error('Only administrators can reset passwords');
                }
                const newPassword = generateRandomPassword();
                const newHash = await hashPassword(newPassword);
                await storage.setUserPassword({
                    id,
                    passwordHash: newHash,
                    mustChangePassword: true,
                });
                await logAudit('user.password.reset', 'user', id, undefined);
                if (user?.id === id) {
                    const refreshed = await storage.getUserById(id);
                    if (refreshed) {
                        setUser(refreshed);
                        setMustChangePassword(true);
                    }
                }
                return newPassword;
            },
            [logAudit, storage, user]
        );

    const setUserStatus: AuthContextValue['setUserStatus'] = useCallback(
        async (id: string, active: boolean) => {
            if (user?.role !== 'admin') {
                throw new Error('Only administrators can update user status');
            }
            await storage.updateUser({ id, attributes: { active } });
            await logAudit(
                active ? 'user.reactivate' : 'user.deactivate',
                'user',
                id
            );
            if (user?.id === id) {
                const refreshed = await storage.getUserById(id);
                if (refreshed) {
                    setUser(refreshed);
                }
            }
        },
        [logAudit, storage, user]
    );

    const listAuditLogs = useCallback(async () => {
        if (user?.role !== 'admin') {
            throw new Error('Only administrators can view audit logs');
        }
        return await storage.listAuditLogs();
    }, [storage, user?.role]);

    const listDiagramVersionsFn = useCallback(
        async (diagramId: string) => {
            return await storage.listDiagramVersions(diagramId);
        },
        [storage]
    );

    const listDiagramActivityFn = useCallback(
        async (diagramId: string) => {
            return await storage.listDiagramActivity(diagramId);
        },
        [storage]
    );

    useEffect(() => {
        if (!user && !isLoading) {
            persistSession(undefined);
        }
    }, [isLoading, user]);

    const value: AuthContextValue = {
        currentUser,
        isLoading,
        mustChangePassword,
        login,
        logout,
        changePassword,
        completeForcedPasswordChange,
        listUsers,
        createUser,
        updateUser,
        resetUserPassword,
        setUserStatus,
        listAuditLogs,
        listDiagramVersions: listDiagramVersionsFn,
        listDiagramActivity: listDiagramActivityFn,
        generatePassword: generateRandomPassword,
        getUserById,
    };

    return (
        <authContext.Provider value={value}>{children}</authContext.Provider>
    );
};
