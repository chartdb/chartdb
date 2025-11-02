import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { AuditLogEntry } from '@/lib/domain/audit-log';

export const AuditLogsPage: React.FC = () => {
    const { listAuditLogs, currentUser } = useAuth();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const entries = await listAuditLogs();
                setLogs(entries);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Unable to load audit logs'
                );
            }
        };
        void load();
    }, [listAuditLogs]);

    if (currentUser?.role !== 'admin') {
        return (
            <div className="rounded-md border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200">
                Only administrators can view audit logs.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-2xl font-semibold text-white">
                    Audit logs
                </h2>
                <p className="text-sm text-slate-400">
                    Review important actions across the workspace.
                </p>
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-800 bg-slate-900/60">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-900/80 text-slate-400">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium">
                                Timestamp
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                                Action
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                                Actor
                            </th>
                            <th className="px-3 py-2 text-left font-medium">
                                Target
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={4}
                                    className="px-3 py-4 text-center text-slate-400"
                                >
                                    No audit events recorded yet.
                                </td>
                            </tr>
                        ) : (
                            logs.map((entry) => (
                                <tr
                                    key={entry.id}
                                    className="border-t border-slate-800"
                                >
                                    <td className="px-3 py-2 text-slate-200">
                                        {new Date(
                                            entry.createdAt
                                        ).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2 text-slate-200">
                                        {entry.action}
                                    </td>
                                    <td className="px-3 py-2 text-slate-200">
                                        {entry.actorId}
                                    </td>
                                    <td className="px-3 py-2 text-slate-200">
                                        {entry.targetType ?? '-'}{' '}
                                        {entry.targetId ?? ''}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
