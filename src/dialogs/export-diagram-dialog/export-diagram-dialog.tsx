import React, { useCallback, useEffect, useMemo } from 'react';
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
import { diagramToJSONOutput } from '@/lib/export-import-utils';

export interface ExportDiagramDialogProps extends BaseDialogProps {}

export const ExportDiagramDialog: React.FC<ExportDiagramDialogProps> = ({
    dialog,
}) => {
    const { t } = useTranslation();
    const { diagramName, currentDiagram } = useChartDB();

    useEffect(() => {
        if (!dialog.open) return;
    }, [dialog.open]);
    const { closeExportDiagramDialog } = useDialog();

    const downloadOutput = useCallback(
        (dataUrl: string) => {
            const a = document.createElement('a');
            a.setAttribute('download', `${diagramName}.json`);
            a.setAttribute('href', dataUrl);
            a.click();
        },
        [diagramName]
    );

    const handleExport = useCallback(() => {
        const json = diagramToJSONOutput(currentDiagram);
        const blob = new Blob([json], { type: 'application/json' });
        const dataUrl = URL.createObjectURL(blob);
        downloadOutput(dataUrl);
    }, [downloadOutput, currentDiagram]);

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
                </div>
                <DialogFooter className="flex gap-1 md:justify-between">
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t('export_diagram_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleExport}>
                            {t('export_diagram_dialog.export')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
