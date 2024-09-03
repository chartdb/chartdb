import { Button } from '@/components/button/button';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
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
import { DialogProps } from '@radix-ui/react-dialog';
import { Annoyed, Sparkles } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';
import { Trans, useTranslation } from 'react-i18next';

export interface ExportSQLDialogProps {
    dialog: DialogProps;
    targetDatabaseType: DatabaseType;
}

export const ExportSQLDialog: React.FC<ExportSQLDialogProps> = ({
    dialog,
    targetDatabaseType,
}) => {
    const { closeExportSQLDialog } = useDialog();
    const { currentDiagram } = useChartDB();
    const { t } = useTranslation();
    const [script, setScript] = React.useState<string>();
    const [error, setError] = React.useState<boolean>(false);

    const exportSQLScript = useCallback(async () => {
        if (targetDatabaseType === DatabaseType.GENERIC) {
            return Promise.resolve(exportBaseSQL(currentDiagram));
        } else {
            return exportSQL(currentDiagram, targetDatabaseType);
        }
    }, [targetDatabaseType, currentDiagram]);

    useEffect(() => {
        if (!dialog.open) return;
        setScript(undefined);
        setError(false);
        const fetchScript = async () => {
            try {
                const script = await exportSQLScript();
                setScript(script);
            } catch (e) {
                setError(true);
            }
        };
        fetchScript();
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
                                    href="mailto:chartdb.io@gmail.com"
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
                className="flex max-h-[80vh] min-w-[500px] flex-col overflow-y-auto xl:min-w-[75vw]"
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
                <div className="flex flex-1 items-center justify-center">
                    {error ? (
                        renderError()
                    ) : script === undefined ? (
                        renderLoader()
                    ) : script.length === 0 ? (
                        renderError()
                    ) : (
                        <CodeSnippet
                            className="max-h-96 w-full"
                            code={script!}
                        />
                    )}
                </div>

                <DialogFooter className="flex !justify-between gap-2">
                    <div />
                    <DialogClose asChild>
                        <Button type="button">
                            {t('export_sql_dialog.close')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
