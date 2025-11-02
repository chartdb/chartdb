import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Diagram } from '@/lib/domain/diagram';
import { useStorage } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import type { DiagramCollaborator } from '@/lib/domain/diagram-collaborator';
import { collaboratorRoles } from '@/lib/domain/diagram-collaborator';
import type { DiagramVersion } from '@/lib/domain/diagram-version';
import type { DiagramActivity } from '@/lib/domain/diagram-activity';
import { generateId } from '@/lib/utils';

interface ShareDialogProps {
    diagram?: Diagram;
    open: boolean;
    onClose: () => void;
    onUpdated?: () => void | Promise<void>;
}

interface CollaboratorView extends DiagramCollaborator {
    username: string;
    displayName: string;
}

const VISIBILITY_OPTIONS = [
    { value: 'private', label: 'Private' },
    { value: 'link_view', label: 'Anyone with link (view)' },
    { value: 'link_edit', label: 'Anyone with link (edit)' },
] as const;

export const ShareDialog: React.FC<ShareDialogProps> = ({
    diagram,
    open,
    onClose,
    onUpdated,
}) => {
    const storage = useStorage();
    const { currentUser } = useAuth();
    const [collaborators, setCollaborators] = useState<CollaboratorView[]>([]);
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<DiagramCollaborator['role']>('viewer');
    const [diagramAllowInvite, setDiagramAllowInvite] = useState(false);
    const [newCanInvite, setNewCanInvite] = useState(false);
    const [error, setError] = useState('');
    const [visibility, setVisibility] = useState<
        'private' | 'link_view' | 'link_edit'
    >('private');
    const [versions, setVersions] = useState<DiagramVersion[]>([]);
    const [activity, setActivity] = useState<DiagramActivity[]>([]);

    const shareLink = useMemo(() => {
        if (!diagram || diagram.visibility === 'private') {
            return '';
        }
        const token = diagram.shareToken ?? '';
        if (typeof window === 'undefined') {
            return '';
        }
        const url = new URL(window.location.origin);
        url.pathname = `/diagrams/${diagram.id}`;
        if (token) {
            url.searchParams.set('token', token);
        }
        return url.toString();
    }, [diagram]);

    const currentCollaborator = useMemo(
        () => collaborators.find((entry) => entry.userId === currentUser?.id),
        [collaborators, currentUser?.id]
    );

    const isOwner = diagram?.ownerId === currentUser?.id;
    const canEdit = useMemo(
        () => isOwner || currentCollaborator?.role === 'editor',
        [currentCollaborator?.role, isOwner]
    );

    const canManage = useMemo(
        () =>
            isOwner ||
            (!!currentCollaborator &&
                (currentCollaborator.canInvite ||
                    (diagram?.allowEditorsToInvite &&
                        currentCollaborator.role === 'editor'))),
        [currentCollaborator, diagram?.allowEditorsToInvite, isOwner]
    );

    const notifyUpdated = useCallback(async () => {
        if (onUpdated) {
            await onUpdated();
        }
    }, [onUpdated]);

    const logAudit = useCallback(
        async (
            action:
                | 'diagram.share.add'
                | 'diagram.share.update'
                | 'diagram.share.remove'
                | 'diagram.visibility.update',
            metadata?: Record<string, unknown>
        ) => {
            if (!diagram) return;
            await storage.addAuditLogEntry({
                id: generateId(),
                action,
                actorId: currentUser?.id ?? 'system',
                createdAt: new Date(),
                targetId: diagram.id,
                targetType: 'diagram',
                metadata,
            });
        },
        [currentUser?.id, diagram, storage]
    );

    const refreshCollaborators = useCallback(async () => {
        if (!diagram) {
            return;
        }
        setLoading(true);
        const items = await storage.listDiagramCollaborators(diagram.id);
        const enriched = await Promise.all(
            items.map(async (entry) => {
                const user = await storage.getUserById(entry.userId);
                return {
                    ...entry,
                    username: user?.username ?? 'unknown',
                    displayName: user?.displayName ?? 'Unknown user',
                };
            })
        );
        setCollaborators(enriched);
        setLoading(false);
    }, [diagram, storage]);

    const refreshMetadata = useCallback(async () => {
        if (!diagram) return;
        const [versionsList, activityList] = await Promise.all([
            storage.listDiagramVersions(diagram.id),
            storage.listDiagramActivity(diagram.id),
        ]);
        setVersions(versionsList);
        setActivity(activityList);
    }, [diagram, storage]);

    const appendActivity = useCallback(
        async (
            type: DiagramActivity['type'],
            metadata?: Record<string, unknown>
        ) => {
            if (!diagram) return;
            await storage.addDiagramActivity({
                id: generateId(),
                diagramId: diagram.id,
                createdAt: new Date(),
                type,
                userId: currentUser?.id,
                metadata,
            });
            await refreshMetadata();
        },
        [currentUser?.id, diagram, refreshMetadata, storage]
    );

    useEffect(() => {
        if (open && diagram) {
            setVisibility(diagram.visibility ?? 'private');
            setDiagramAllowInvite(diagram.allowEditorsToInvite ?? false);
            setNewCanInvite(false);
            void refreshCollaborators();
            void refreshMetadata();
        }
    }, [diagram, open, refreshCollaborators, refreshMetadata]);

    const handleAddCollaborator = useCallback(async () => {
        if (!diagram || !canManage) return;
        setError('');
        const trimmedUsername = username.trim();
        if (!trimmedUsername) {
            setError('Username is required');
            return;
        }
        const targetUser = await storage.getUserByUsername(trimmedUsername);
        if (!targetUser) {
            setError('User not found');
            return;
        }
        if (targetUser.id === diagram.ownerId) {
            setError('Owner already has full access');
            return;
        }
        const existing = collaborators.find(
            (entry) => entry.userId === targetUser.id
        );
        if (existing) {
            setError('User already added');
            return;
        }
        const collaborator: DiagramCollaborator = {
            id: generateId(),
            diagramId: diagram.id,
            userId: targetUser.id,
            role,
            canInvite: newCanInvite,
            invitedBy: currentUser?.id ?? 'system',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await storage.addDiagramCollaborator({ collaborator });
        await appendActivity('diagram.shared', {
            targetUser: targetUser.username,
            role,
        });
        await logAudit('diagram.share.add', {
            collaboratorId: collaborator.id,
            username: targetUser.username,
            role,
        });
        setUsername('');
        setNewCanInvite(false);
        await refreshCollaborators();
        await notifyUpdated();
    }, [
        appendActivity,
        canManage,
        collaborators,
        currentUser?.id,
        diagram,
        logAudit,
        newCanInvite,
        notifyUpdated,
        refreshCollaborators,
        role,
        storage,
        username,
    ]);

    const updateCollaboratorRole = useCallback(
        async (
            collaborator: CollaboratorView,
            updates: Partial<Pick<DiagramCollaborator, 'role' | 'canInvite'>>
        ) => {
            if (!canManage) return;
            await storage.updateDiagramCollaborator({
                id: collaborator.id,
                attributes: updates,
            });
            await appendActivity('diagram.shared', {
                targetUser: collaborator.username,
                updates,
            });
            await logAudit('diagram.share.update', {
                collaboratorId: collaborator.id,
                updates,
            });
            await refreshCollaborators();
            await notifyUpdated();
        },
        [
            appendActivity,
            canManage,
            logAudit,
            notifyUpdated,
            refreshCollaborators,
            storage,
        ]
    );

    const removeCollaborator = useCallback(
        async (collaborator: CollaboratorView) => {
            if (!canManage) return;
            await storage.removeDiagramCollaborator(collaborator.id);
            await appendActivity('diagram.unshared', {
                targetUser: collaborator.username,
            });
            await logAudit('diagram.share.remove', {
                collaboratorId: collaborator.id,
                username: collaborator.username,
            });
            await refreshCollaborators();
            await notifyUpdated();
        },
        [
            appendActivity,
            canManage,
            logAudit,
            notifyUpdated,
            refreshCollaborators,
            storage,
        ]
    );

    const updateVisibility = useCallback(
        async (value: 'private' | 'link_view' | 'link_edit') => {
            if (!diagram || !canManage) return;
            const previous = visibility;
            await storage.updateDiagramVisibility({
                diagramId: diagram.id,
                visibility: value,
                shareToken: diagram.shareToken ?? generateId(),
                allowEditorsToInvite: diagramAllowInvite,
            });
            setVisibility(value);
            await logAudit('diagram.visibility.update', {
                from: previous,
                to: value,
            });
            await appendActivity(
                value === 'private' ? 'diagram.unshared' : 'diagram.shared',
                { visibility: value }
            );
            await notifyUpdated();
        },
        [
            appendActivity,
            canManage,
            diagram,
            diagramAllowInvite,
            logAudit,
            notifyUpdated,
            storage,
            visibility,
        ]
    );

    const toggleInvite = useCallback(
        async (value: boolean) => {
            if (!diagram || !canManage) return;
            await storage.updateDiagramVisibility({
                diagramId: diagram.id,
                visibility,
                allowEditorsToInvite: value,
                shareToken: diagram.shareToken ?? generateId(),
            });
            setDiagramAllowInvite(value);
            await logAudit('diagram.visibility.update', {
                field: 'allowEditorsToInvite',
                value,
            });
            await appendActivity('diagram.shared', {
                allowEditorsToInvite: value,
            });
            await notifyUpdated();
        },
        [
            appendActivity,
            canManage,
            diagram,
            logAudit,
            notifyUpdated,
            storage,
            visibility,
        ]
    );

    const handleSaveVersion = useCallback(async () => {
        if (!diagram || !canEdit) return;
        const fullDiagram = await storage.getDiagram(diagram.id, {
            includeAreas: true,
            includeTables: true,
            includeRelationships: true,
            includeDependencies: true,
            includeCustomTypes: true,
        });
        if (!fullDiagram) return;
        const nextVersion = versions.length > 0 ? versions[0].version + 1 : 1;
        const version: DiagramVersion = {
            id: generateId(),
            diagramId: diagram.id,
            version: nextVersion,
            name: `Snapshot ${nextVersion}`,
            createdAt: new Date(),
            createdBy: currentUser?.id,
            snapshot: JSON.stringify(fullDiagram),
        };
        await storage.addDiagramVersion({ version });
        await appendActivity('diagram.updated', { reason: 'manual-version' });
    }, [appendActivity, canEdit, currentUser?.id, diagram, storage, versions]);

    if (!open || !diagram) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="flex w-full max-w-4xl flex-col gap-6 rounded-lg bg-slate-900 p-6 text-slate-200 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">
                            Share “{diagram.name}”
                        </h2>
                        <p className="text-sm text-slate-400">
                            Manage collaborators and sharing options for this
                            diagram.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="rounded-md bg-slate-800 px-3 py-1 text-sm text-slate-200 hover:bg-slate-700"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Share link
                    </h3>
                    <div className="flex flex-col gap-3 rounded-md border border-slate-800 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <label className="text-sm text-slate-300">
                                Link access
                            </label>
                            <select
                                value={visibility}
                                onChange={(event) =>
                                    updateVisibility(
                                        event.target.value as typeof visibility
                                    )
                                }
                                className="w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none sm:w-64"
                                disabled={!canManage}
                            >
                                {VISIBILITY_OPTIONS.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {visibility !== 'private' ? (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                    value={shareLink}
                                    readOnly
                                    className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
                                />
                                <button
                                    type="button"
                                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                                    onClick={() => {
                                        if (shareLink) {
                                            void navigator.clipboard.writeText(
                                                shareLink
                                            );
                                        }
                                    }}
                                >
                                    Copy link
                                </button>
                            </div>
                        ) : null}
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={diagramAllowInvite}
                                onChange={(event) =>
                                    toggleInvite(event.target.checked)
                                }
                                className="size-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                disabled={!canManage}
                            />
                            Allow editors to invite collaborators
                        </label>
                    </div>
                </section>
                <section className="space-y-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                        Collaborators
                    </h3>
                    <div className="flex flex-col gap-3 rounded-md border border-slate-800 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <input
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                placeholder="Username"
                                className="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                disabled={!canManage}
                            />
                            <select
                                value={role}
                                onChange={(event) =>
                                    setRole(
                                        event.target
                                            .value as DiagramCollaborator['role']
                                    )
                                }
                                className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                                disabled={!canManage}
                            >
                                {collaboratorRoles.map((roleOption) => (
                                    <option key={roleOption} value={roleOption}>
                                        {roleOption === 'viewer'
                                            ? 'Viewer'
                                            : 'Editor'}
                                    </option>
                                ))}
                            </select>
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={newCanInvite}
                                    onChange={(event) =>
                                        setNewCanInvite(event.target.checked)
                                    }
                                    className="size-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                    disabled={!canManage}
                                />
                                Can invite
                            </label>
                            <button
                                type="button"
                                onClick={() => void handleAddCollaborator()}
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                                disabled={
                                    loading ||
                                    !canManage ||
                                    username.trim().length === 0
                                }
                            >
                                Add
                            </button>
                        </div>
                        {error ? (
                            <p className="text-sm text-red-400">{error}</p>
                        ) : null}
                        <div className="max-h-64 overflow-auto rounded-md border border-slate-800">
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
                                            Can invite
                                        </th>
                                        <th className="px-3 py-2 text-left font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-3 py-4 text-center text-slate-400"
                                            >
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : collaborators.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-3 py-4 text-center text-slate-400"
                                            >
                                                No collaborators added yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        collaborators.map((entry) => (
                                            <tr
                                                key={entry.id}
                                                className="border-t border-slate-800"
                                            >
                                                <td className="px-3 py-2 text-slate-200">
                                                    <div className="font-medium">
                                                        {entry.displayName}
                                                    </div>
                                                    <div className="text-xs text-slate-400">
                                                        {entry.username}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={entry.role}
                                                        onChange={(event) =>
                                                            updateCollaboratorRole(
                                                                entry,
                                                                {
                                                                    role: event
                                                                        .target
                                                                        .value as DiagramCollaborator['role'],
                                                                }
                                                            )
                                                        }
                                                        className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-sm text-white"
                                                        disabled={!canManage}
                                                    >
                                                        {collaboratorRoles.map(
                                                            (option) => (
                                                                <option
                                                                    key={option}
                                                                    value={
                                                                        option
                                                                    }
                                                                >
                                                                    {option ===
                                                                    'viewer'
                                                                        ? 'Viewer'
                                                                        : 'Editor'}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            entry.canInvite
                                                        }
                                                        onChange={(event) =>
                                                            updateCollaboratorRole(
                                                                entry,
                                                                {
                                                                    canInvite:
                                                                        event
                                                                            .target
                                                                            .checked,
                                                                }
                                                            )
                                                        }
                                                        className="size-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                                                        disabled={!canManage}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            void removeCollaborator(
                                                                entry
                                                            )
                                                        }
                                                        className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-400"
                                                        disabled={!canManage}
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
                <section className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-md border border-slate-800 p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                                Version history
                            </h3>
                            <button
                                type="button"
                                onClick={() => void handleSaveVersion()}
                                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                                disabled={!canEdit}
                            >
                                Save version
                            </button>
                        </div>
                        <ul className="space-y-2">
                            {versions.length === 0 ? (
                                <li className="text-sm text-slate-400">
                                    No versions saved yet.
                                </li>
                            ) : (
                                versions.map((entry) => (
                                    <li
                                        key={entry.id}
                                        className="rounded-md border border-slate-800 px-3 py-2"
                                    >
                                        <div className="text-sm font-medium text-white">
                                            {entry.name}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(
                                                entry.createdAt
                                            ).toLocaleString()}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                    <div className="rounded-md border border-slate-800 p-4">
                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                            Recent activity
                        </h3>
                        <ul className="space-y-2">
                            {activity.length === 0 ? (
                                <li className="text-sm text-slate-400">
                                    No recent activity.
                                </li>
                            ) : (
                                activity.map((item) => (
                                    <li
                                        key={item.id}
                                        className="rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-200"
                                    >
                                        <div className="font-medium">
                                            {item.type}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(
                                                item.createdAt
                                            ).toLocaleString()}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </section>
            </div>
        </div>
    );
};
