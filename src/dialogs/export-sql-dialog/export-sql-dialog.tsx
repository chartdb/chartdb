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
                <div className="flex items-center justify-center flex-col text-sm gap-1">
                    <Annoyed className="w-10 h-10" />
                    <Label className="text-sm">
                        Error generating SQL script. Please try again later or{' '}
                        <Button
                            variant="link"
                            className="text-pink-600 p-0"
                            onClick={() =>
                                window.open(
                                    'mailto:chartdb.io@gmail.com',
                                    '_blank'
                                )
                            }
                        >
                            contact us
                        </Button>
                        .
                    </Label>
                    <div>
                        Feel free to use your OPENAI_TOKEN, see the manual{' '}
                        <Button
                            variant="link"
                            className="text-pink-600 p-0"
                            onClick={() =>
                                window.open(
                                    'https://github.com/chartdb/chartdb',
                                    '_blank'
                                )
                            }
                        >
                            here.
                        </Button>
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
                        AI is generating SQL for{' '}
                        {databaseTypeToLabelMap[targetDatabaseType]}...
                    </Label>
                </div>
                <div className="flex items-center justify-center gap-1">
                    <Label className="text-sm">
                        This should take up to 30 seconds.
                    </Label>
                </div>
            </div>
        ),
        [targetDatabaseType]
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
                className="flex flex-col min-w-[500px] xl:min-w-[75vw] max-h-[80vh] overflow-y-auto"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>Export SQL</DialogTitle>
                    <DialogDescription>
                        {`Export your diagram schema to ${
                            targetDatabaseType === DatabaseType.GENERIC
                                ? 'SQL'
                                : databaseTypeToLabelMap[targetDatabaseType]
                        } script`}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-1 items-center justify-center">
                    {error ? (
                        renderError()
                    ) : (script?.length ?? 0) === 0 ? (
                        renderLoader()
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
                        <Button type="button">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
