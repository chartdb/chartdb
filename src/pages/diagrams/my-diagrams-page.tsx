import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStorage } from '@/hooks/use-storage';
import { useAuth } from '@/hooks/use-auth';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';
import { generateDiagramId, generateId } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ShareDialog } from '@/components/share/share-dialog';

interface OwnedDiagram extends Diagram {
    collaboratorCount: number;
}

const visibilityLabel = (value: Diagram['visibility']) => {
    switch (value) {
        case 'link_edit':
            return 'Anyone with link (edit)';
        case 'link_view':
            return 'Anyone with link (view)';
        default:
            return 'Private';
    }
};

export const MyDiagramsPage: React.FC = () => {
    const storage = useStorage();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [diagrams, setDiagrams] = useState<OwnedDiagram[]>([]);
    const [loading, setLoading] = useState(true);
    const [shareTarget, setShareTarget] = useState<Diagram | undefined>();

    const refresh = useCallback(async () => {
        if (!currentUser) {
            return;
        }
        setLoading(true);
        const allDiagrams = await storage.listDiagrams();
        const owned = allDiagrams.filter(
            (diagram) => diagram.ownerId === currentUser.id
        );
        const withCounts = await Promise.all(
            owned.map(async (diagram) => ({
                ...diagram,
                collaboratorCount: (
                    await storage.listDiagramCollaborators(diagram.id)
                ).length,
            }))
        );
        withCounts.sort(
            (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        setDiagrams(withCounts);
        setLoading(false);
    }, [currentUser, storage]);

    useEffect(() => {
        if (currentUser) {
            void refresh();
        }
    }, [currentUser, refresh]);

    const handleCreate = useCallback(async () => {
        if (!currentUser) {
            return;
        }
        const now = new Date();
        const id = generateDiagramId();
        const diagram: Diagram = {
            id,
            name: `Diagram ${diagrams.length + 1}`,
            databaseType: DatabaseType.GENERIC,
            createdAt: now,
            updatedAt: now,
            ownerId: currentUser.id,
            visibility: 'private',
            allowEditorsToInvite: false,
            shareToken: generateId(),
        };
        await storage.addDiagram({ diagram });
        await storage.addDiagramActivity({
            id: generateId(),
            diagramId: id,
            createdAt: now,
            userId: currentUser.id,
            type: 'diagram.updated',
            metadata: { reason: 'created' },
        });
        await refresh();
        navigate(`/diagrams/${id}`);
    }, [currentUser, diagrams.length, navigate, refresh, storage]);

    const shareStatus = useMemo(() => {
        const map = new Map<string, string>();
        for (const diagram of diagrams) {
            if (diagram.visibility !== 'private') {
                map.set(diagram.id, visibilityLabel(diagram.visibility));
            } else if (diagram.collaboratorCount > 0) {
                map.set(diagram.id, 'Shared privately');
            } else {
                map.set(diagram.id, 'Private');
            }
        }
        return map;
    }, [diagrams]);

    if (!currentUser) {
        return null;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-white">
                        My diagrams
                    </h2>
                    <p className="text-sm text-slate-400">
                        Create, manage, and collaborate on diagrams that you
                        own.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => void handleCreate()}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
                >
                    New diagram
                </button>
            </div>
            {loading ? (
                <div className="rounded-md border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-300">
                    Loading your diagrams…
                </div>
            ) : diagrams.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-700 bg-slate-900/40 p-10 text-center text-slate-300">
                    <p className="mb-3 text-lg font-medium text-white">
                        No diagrams yet
                    </p>
                    <p className="text-sm text-slate-400">
                        Start a new project to design your database schemas.
                    </p>
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
                                    Updated {diagram.updatedAt.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1 text-sm">
                                <div>
                                    <span className="text-slate-400">
                                        Sharing:
                                    </span>{' '}
                                    <span className="text-slate-100">
                                        {shareStatus.get(diagram.id) ??
                                            'Private'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-400">
                                        Collaborators:
                                    </span>{' '}
                                    <span className="text-slate-100">
                                        {diagram.collaboratorCount}
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
                                <button
                                    type="button"
                                    className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-blue-500 hover:text-white"
                                    onClick={() => setShareTarget(diagram)}
                                >
                                    Share
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
            <ShareDialog
                diagram={shareTarget}
                open={Boolean(shareTarget)}
                onClose={() => {
                    setShareTarget(undefined);
                    void refresh();
                }}
                onUpdated={refresh}
            />
        </div>
    );
};
