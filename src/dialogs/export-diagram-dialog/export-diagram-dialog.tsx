import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Button } from '@/components/button/button';
import type { SelectBoxOption } from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { useTranslation } from 'react-i18next';
import { useChartDB } from '@/hooks/use-chartdb';
import { Spinner } from '@/components/spinner/spinner';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/alert/alert';
import { useExportDiagram } from '@/hooks/use-export-diagram';

export interface ExportDiagramDialogProps extends BaseDialogProps {}

export const ExportDiagramDialog: React.FC<ExportDiagramDialogProps> = ({
    dialog,
}) => {
    const { t } = useTranslation();
    const { currentDiagram } = useChartDB();
    const { closeExportDiagramDialog } = useDialog();
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!dialog.open) return;
        setError(false);
    }, [dialog.open]);

    const { exportDiagram, isExporting: isLoading } = useExportDiagram();

    const handleExport = useCallback(async () => {
        try {
            await exportDiagram({ diagram: currentDiagram });
            closeExportDiagramDialog();
        } catch (e) {
            setError(true);

            throw e;
        }
    }, [exportDiagram, currentDiagram, closeExportDiagramDialog]);

    const outputTypeOptions: SelectBoxOption[] = useMemo(
        () =>
            ['json'].map((format) => ({
                value: format,
                label: t(`export_diagram_dialog.format_${format}`),
            })),
        [t]
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeExportDiagramDialog();
                }
            }}
        >
            <DialogContent className="flex flex-col" showClose>
                <DialogHeader>
                    <DialogTitle>
                        {t('export_diagram_dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('export_diagram_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-1">
                    <div className="grid w-full items-center gap-4">
                        <SelectBox
                            options={outputTypeOptions}
                            multiple={false}
                            value="json"
                        />
                    </div>
                    {error ? (
                        <Alert variant="destructive">
                            <AlertCircle className="size-4" />
                            <AlertTitle>
                                {t('export_diagram_dialog.error.title')}
                            </AlertTitle>
                            <AlertDescription>
                                {t('export_diagram_dialog.error.description')}
                            </AlertDescription>
                        </Alert>
                    ) : null}
                </div>
                <DialogFooter className="flex gap-1 md:justify-between">
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t('export_diagram_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <Button onClick={handleExport} disabled={isLoading}>
                        {isLoading ? (
                            <Spinner className="mr-1 size-5 text-primary-foreground" />
                        ) : null}
                        {t('export_diagram_dialog.export')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
