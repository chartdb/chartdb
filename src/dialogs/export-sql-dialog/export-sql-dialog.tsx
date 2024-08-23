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
import { Sparkles } from 'lucide-react';
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
        const fetchScript = async () => {
            const script = await exportSQLScript();
            setScript(script);
        };
        fetchScript();
    }, [dialog.open, setScript, exportSQLScript]);

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
                        {(script?.length ?? 0) === 0 ? (
                            'Export the SQL of the current diagram'
                        ): (
                            `${databaseTypeToLabelMap[targetDatabaseType]} - SQL code of the current diagram.`
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-1 items-center justify-center">
                    {(script?.length ?? 0) === 0 ? (
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
