import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { SessionUser } from '@/context/auth-context/auth-context';

interface EditableUser extends SessionUser {
    usernameInput: string;
    displayNameInput: string;
}

export const UserManagementPage: React.FC = () => {
    const {
        currentUser,
        listUsers,
        createUser,
        updateUser,
        resetUserPassword,
        setUserStatus,
        generatePassword,
    } = useAuth();
    const [users, setUsers] = useState<EditableUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwords, setPasswords] = useState<Record<string, string>>({});
    const [newUser, setNewUser] = useState({
        username: '',
        displayName: '',
        role: 'user' as SessionUser['role'],
        autoPassword: true,
        password: '',
    });

    const refresh = useCallback(async () => {
        setLoading(true);
        const items = await listUsers();
        setUsers(
            items.map((user) => ({
                ...user,
                usernameInput: user.username,
                displayNameInput: user.displayName,
            }))
        );
        setLoading(false);
    }, [listUsers]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const isAdmin = currentUser?.role === 'admin';

    const handleCreate = useCallback(async () => {
        setError('');
        setSuccess('');
        const username = newUser.username.trim();
        const displayName = newUser.displayName.trim();
        if (!username) {
            setError('Username is required');
            return;
        }
        if (!displayName) {
            setError('Display name is required');
            return;
        }
        if (!newUser.autoPassword && newUser.password.trim().length === 0) {
            setError('Password is required when not auto-generating');
            return;
        }
        try {
            const payloadPassword = newUser.autoPassword
                ? undefined
                : newUser.password.trim();
            const result = await createUser({
                username,
                displayName,
                role: newUser.role,
                password: payloadPassword,
                mustChangePassword: true,
            });
            setPasswords((prev) => ({
                ...prev,
                [result.user.id]: result.password,
            }));
            setNewUser({
                username: '',
                displayName: '',
                role: 'user',
                autoPassword: true,
                password: '',
            });
            setSuccess(
                `User ${result.user.username} created. Temporary password: ${result.password}`
            );
            await refresh();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Unable to create user'
            );
            setSuccess('');
        }
    }, [createUser, newUser, refresh]);

    const handleUpdateUser = useCallback(
        async (user: EditableUser) => {
            await updateUser(user.id, {
                username: user.usernameInput,
                displayName: user.displayNameInput,
            });
            await refresh();
        },
        [refresh, updateUser]
    );

    const handleResetPassword = useCallback(
        async (userId: string) => {
            const password = await resetUserPassword(userId);
            setPasswords((prev) => ({ ...prev, [userId]: password }));
        },
        [resetUserPassword]
    );

    const toggleUserStatus = useCallback(
        async (user: EditableUser) => {
            await setUserStatus(user.id, !user.active);
            await refresh();
        },
        [refresh, setUserStatus]
    );

    const generatedPasswordHint = useMemo(() => {
        if (!newUser.autoPassword) {
            return null;
        }
        return (
            <button
                type="button"
                onClick={() => {
                    setError('');
                    setSuccess('');
                    setNewUser((prev) => ({
                        ...prev,
                        password: generatePassword(),
                        autoPassword: false,
                    }));
                }}
                className="text-xs text-blue-400 hover:text-blue-300"
            >
                Generate manual password
            </button>
        );
    }, [generatePassword, newUser.autoPassword]);

    if (!isAdmin) {
        return (
            <div className="rounded-md border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
                You need administrator privileges to manage users.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-white">
                    User management
                </h2>
                <p className="text-sm text-slate-400">
                    Create and manage workspace users. Reset passwords and
                    control access levels.
                </p>
            </div>
            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-4 text-lg font-semibold text-white">
                    Create a new user
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                            Username
                        </label>
                        <input
                            value={newUser.username}
                            onChange={(event) => {
                                setError('');
                                setSuccess('');
                                setNewUser((prev) => ({
                                    ...prev,
                                    username: event.target.value,
                                }));
                            }}
                            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                            Display name
                        </label>
                        <input
                            value={newUser.displayName}
                            onChange={(event) => {
                                setError('');
                                setSuccess('');
                                setNewUser((prev) => ({
                                    ...prev,
                                    displayName: event.target.value,
                                }));
                            }}
                            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                            Role
                        </label>
                        <select
                            value={newUser.role}
                            onChange={(event) => {
                                setError('');
                                setSuccess('');
                                setNewUser((prev) => ({
                                    ...prev,
                                    role: event.target
                                        .value as SessionUser['role'],
                                }));
                            }}
                            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs uppercase tracking-wide text-slate-400">
                            Password
                        </label>
                        {newUser.autoPassword ? (
                            <div className="flex items-center justify-between rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300">
                                <span>Will be generated automatically</span>
                                {generatedPasswordHint}
                            </div>
                        ) : (
                            <input
                                value={newUser.password}
                                onChange={(event) => {
                                    setError('');
                                    setSuccess('');
                                    setNewUser((prev) => ({
                                        ...prev,
                                        password: event.target.value,
                                    }));
                                }}
                                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                            />
                        )}
                    </div>
                </div>
                {error ? (
                    <p className="mt-3 text-sm text-red-400">{error}</p>
                ) : null}
                {success ? (
                    <p className="mt-3 text-sm text-emerald-400">{success}</p>
                ) : null}
                <button
                    type="button"
                    onClick={() => void handleCreate()}
                    className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    Create user
                </button>
            </section>
            <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h3 className="mb-4 text-lg font-semibold text-white">
                    Existing users
                </h3>
                {loading ? (
                    <div className="text-sm text-slate-400">Loading…</div>
                ) : (
                    <div className="max-h-[28rem] overflow-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-900/80 text-slate-400">
                                <tr>
                                    <th className="px-3 py-2 text-left font-medium">
                                        User
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Role
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left font-medium">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="border-t border-slate-800"
                                    >
                                        <td className="px-3 py-2">
                                            <div className="flex flex-col gap-1">
                                                <input
                                                    value={user.usernameInput}
                                                    onChange={(event) =>
                                                        setUsers((prev) =>
                                                            prev.map((entry) =>
                                                                entry.id ===
                                                                user.id
                                                                    ? {
                                                                          ...entry,
                                                                          usernameInput:
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : entry
                                                            )
                                                        )
                                                    }
                                                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                                                />
                                                <input
                                                    value={
                                                        user.displayNameInput
                                                    }
                                                    onChange={(event) =>
                                                        setUsers((prev) =>
                                                            prev.map((entry) =>
                                                                entry.id ===
                                                                user.id
                                                                    ? {
                                                                          ...entry,
                                                                          displayNameInput:
                                                                              event
                                                                                  .target
                                                                                  .value,
                                                                      }
                                                                    : entry
                                                            )
                                                        )
                                                    }
                                                    className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                                                />
                                                {passwords[user.id] ? (
                                                    <div className="text-xs text-green-400">
                                                        Temporary password:{' '}
                                                        {passwords[user.id]}
                                                    </div>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-slate-200">
                                            {user.role}
                                        </td>
                                        <td className="px-3 py-2">
                                            <span
                                                className={
                                                    user.active
                                                        ? 'rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-300'
                                                        : 'rounded-full bg-slate-700/40 px-2 py-1 text-xs text-slate-300'
                                                }
                                            >
                                                {user.active
                                                    ? 'Active'
                                                    : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-blue-500 hover:text-white"
                                                    onClick={() =>
                                                        void handleUpdateUser(
                                                            user
                                                        )
                                                    }
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-blue-500 hover:text-white"
                                                    onClick={() =>
                                                        void handleResetPassword(
                                                            user.id
                                                        )
                                                    }
                                                >
                                                    Reset password
                                                </button>
                                                <button
                                                    type="button"
                                                    className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-blue-500 hover:text-white"
                                                    disabled={
                                                        user.id ===
                                                        currentUser?.id
                                                    }
                                                    onClick={() =>
                                                        void toggleUserStatus(
                                                            user
                                                        )
                                                    }
                                                >
                                                    {user.active
                                                        ? 'Deactivate'
                                                        : 'Reactivate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};
