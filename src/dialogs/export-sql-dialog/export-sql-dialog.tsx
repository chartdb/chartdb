import { Button } from '@/components/button/button';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Label } from '@/components/label/label';
import { Spinner } from '@/components/spinner/spinner';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import {
    exportBaseSQL,
    exportSQL,
} from '@/lib/data/export-metadata/export-sql-script';
import { databaseTypeToLabelMap } from '@/lib/databases';
import { DatabaseType } from '@/lib/domain/database-type';
import { shouldShowTablesBySchemaFilter } from '@/lib/domain/db-table';
import { Annoyed, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import type { BaseDialogProps } from '../common/base-dialog-props';
import type { Diagram } from '@/lib/domain/diagram';

export interface ExportSQLDialogProps extends BaseDialogProps {
    targetDatabaseType: DatabaseType;
}

export const ExportSQLDialog: React.FC<ExportSQLDialogProps> = ({
    dialog,
    targetDatabaseType,
}) => {
    const { closeExportSQLDialog } = useDialog();
    const { currentDiagram, filteredSchemas } = useChartDB();
    const { t } = useTranslation();
    const [script, setScript] = React.useState<string>();
    const [error, setError] = React.useState<boolean>(false);
    const [isScriptLoading, setIsScriptLoading] =
        React.useState<boolean>(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const exportSQLScript = useCallback(async () => {
        const filteredDiagram: Diagram = {
            ...currentDiagram,
            tables: currentDiagram.tables?.filter((table) =>
                shouldShowTablesBySchemaFilter(table, filteredSchemas)
            ),
            relationships: currentDiagram.relationships?.filter((rel) => {
                const sourceTable = currentDiagram.tables?.find(
                    (t) => t.id === rel.sourceTableId
                );
                const targetTable = currentDiagram.tables?.find(
                    (t) => t.id === rel.targetTableId
                );
                return (
                    sourceTable &&
                    targetTable &&
                    shouldShowTablesBySchemaFilter(
                        sourceTable,
                        filteredSchemas
                    ) &&
                    shouldShowTablesBySchemaFilter(targetTable, filteredSchemas)
                );
            }),
            dependencies: currentDiagram.dependencies?.filter((dep) => {
                const table = currentDiagram.tables?.find(
                    (t) => t.id === dep.tableId
                );
                const dependentTable = currentDiagram.tables?.find(
                    (t) => t.id === dep.dependentTableId
                );
                return (
                    table &&
                    dependentTable &&
                    shouldShowTablesBySchemaFilter(table, filteredSchemas) &&
                    shouldShowTablesBySchemaFilter(
                        dependentTable,
                        filteredSchemas
                    )
                );
            }),
        };

        if (targetDatabaseType === DatabaseType.GENERIC) {
            return Promise.resolve(
                exportBaseSQL({
                    diagram: filteredDiagram,
                    targetDatabaseType,
                })
            );
        } else {
            return exportSQL(filteredDiagram, targetDatabaseType, {
                stream: true,
                onResultStream: (text) =>
                    setScript((prev) => (prev ? prev + text : text)),
                signal: abortControllerRef.current?.signal,
            });
        }
    }, [targetDatabaseType, currentDiagram, filteredSchemas]);

    useEffect(() => {
        if (!dialog.open) {
            abortControllerRef.current?.abort();

            return;
        }
        abortControllerRef.current = new AbortController();
        setScript(undefined);
        setError(false);
        const fetchScript = async () => {
            try {
                setIsScriptLoading(true);
                const script = await exportSQLScript();
                setScript(script);
                setIsScriptLoading(false);
            } catch {
                setError(true);
            }
        };
        fetchScript();

        return () => {
            abortControllerRef.current?.abort();
        };
    }, [dialog.open, setScript, exportSQLScript, setError]);

    const renderError = useCallback(
        () => (
            <div className="flex flex-col gap-2">
                <div className="flex flex-col items-center justify-center gap-1 text-sm">
                    <Annoyed className="size-10" />
                    <Label className="text-sm">
                        <Trans
                            i18nKey="export_sql_dialog.error.message" // optional -> fallbacks to defaults if not provided
                            components={[
                                <a
                                    key={0}
                                    href="mailto:support@chartdb.io"
                                    target="_blank"
                                    className="text-pink-600 hover:underline"
                                    rel="noreferrer"
                                />,
                            ]}
                        />
                    </Label>
                    <div>
                        <Trans
                            i18nKey="export_sql_dialog.error.description" // optional -> fallbacks to defaults if not provided
                            components={[
                                <a
                                    key={0}
                                    href="https://github.com/chartdb/chartdb"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-pink-600 hover:underline"
                                />,
                            ]}
                        />
                    </div>
                </div>
            </div>
        ),
        []
    );

    const renderLoader = useCallback(
        () => (
            <div className="flex flex-col gap-2">
                <Spinner />
                <div className="flex items-center justify-center gap-1">
                    <Sparkles className="h-5" />
                    <Label className="text-lg">
                        {t('export_sql_dialog.loading.text', {
                            databaseType:
                                databaseTypeToLabelMap[targetDatabaseType],
                        })}
                    </Label>
                </div>
                <div className="flex items-center justify-center gap-1">
                    <Label className="text-sm">
                        {t('export_sql_dialog.loading.description')}
                    </Label>
                </div>
            </div>
        ),
        [targetDatabaseType, t]
    );
    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeExportSQLDialog();
                }
            }}
        >
            <DialogContent
                className="flex max-h-screen flex-col overflow-y-auto xl:min-w-[75vw]"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>{t('export_sql_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('export_sql_dialog.description', {
                            databaseType:
                                targetDatabaseType === DatabaseType.GENERIC
                                    ? 'SQL'
                                    : databaseTypeToLabelMap[
                                          targetDatabaseType
                                      ],
                        })}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent>
                    <div className="flex flex-1 items-center justify-center">
                        {error ? (
                            renderError()
                        ) : script === undefined ? (
                            renderLoader()
                        ) : script.length === 0 ? (
                            renderError()
                        ) : (
                            <CodeSnippet
                                className="h-96 w-full"
                                code={script!}
                                autoScroll={true}
                                isComplete={!isScriptLoading}
                            />
                        )}
                    </div>
                </DialogInternalContent>
                <DialogFooter className="flex !justify-between gap-2">
                    <div />
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t('export_sql_dialog.close')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
