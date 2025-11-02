import React, { useCallback, useEffect, useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import type { Diagram } from '@/lib/domain/diagram';
import type { DiagramCollaborator } from '@/lib/domain/diagram-collaborator';

interface SharedDiagram extends Diagram {
    role: DiagramCollaborator['role'];
    canInvite: boolean;
    ownerName: string;
    access: 'collaborator' | 'link_view' | 'link_edit';
}

export const SharedWithMePage: React.FC = () => {
    const storage = useStorage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [diagrams, setDiagrams] = useState<SharedDiagram[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        const allDiagrams = await storage.listDiagrams();
        const entries: SharedDiagram[] = [];
        for (const diagram of allDiagrams) {
            if (diagram.ownerId === currentUser.id) {
                continue;
            }
            const owner = diagram.ownerId
                ? await storage.getUserById(diagram.ownerId)
                : undefined;

            const collaborators = await storage.listDiagramCollaborators(
                diagram.id
            );
            const match = collaborators.find(
                (entry) => entry.userId === currentUser.id
            );
            if (match) {
                entries.push({
                    ...diagram,
                    role: match.role,
                    canInvite: match.canInvite,
                    ownerName: owner?.displayName ?? 'Unknown',
                    access: 'collaborator',
                });
                continue;
            }

            if (diagram.visibility && diagram.visibility !== 'private') {
                const role: DiagramCollaborator['role'] =
                    diagram.visibility === 'link_edit' ? 'editor' : 'viewer';
                const canInvite =
                    diagram.visibility === 'link_edit' &&
                    (diagram.allowEditorsToInvite ?? false);
                entries.push({
                    ...diagram,
                    role,
                    canInvite,
                    ownerName: owner?.displayName ?? 'Unknown',
                    access: diagram.visibility,
                });
            }
        }
        entries.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        setDiagrams(entries);
        setLoading(false);
    }, [currentUser, storage]);

    useEffect(() => {
        if (currentUser) {
            void refresh();
        }
    }, [currentUser, refresh]);

    if (!currentUser) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-semibold text-white">
                    Shared with me
                </h2>
                <p className="text-sm text-slate-400">
                    Diagrams shared by your teammates. You can open them
                    directly from here.
                </p>
            </div>
            {loading ? (
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
                    Loading diagrams…
                </div>
            ) : diagrams.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-300">
                    Nothing shared with you yet.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {diagrams.map((diagram) => (
                        <article
                            key={diagram.id}
                            className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-slate-200 shadow"
                        >
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {diagram.name}
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Owner: {diagram.ownerName}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div>
                                    <span className="text-slate-400">
                                        Your role:
                                    </span>{' '}
                                    <span className="text-slate-100">
                                        {diagram.role}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">
                                        Can invite:
                                    </span>{' '}
                                    <span className="text-slate-100">
                                        {diagram.canInvite ? 'Yes' : 'No'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">
                                        Access:
                                    </span>{' '}
                                    <span className="text-slate-100">
                                        {diagram.access === 'collaborator'
                                            ? 'Direct share'
                                            : diagram.access === 'link_edit'
                                              ? 'Link (edit)'
                                              : 'Link (view)'}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-auto flex gap-2">
                                <button
                                    type="button"
                                    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
                                    onClick={() =>
                                        navigate(`/diagrams/${diagram.id}`)
                                    }
                                >
                                    Open
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};
