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
import type { ImageType } from '@/context/export-image-context/export-image-context';
import { useExportImage } from '@/hooks/use-export-image';

export interface ExportImageDialogProps extends BaseDialogProps {
    format: ImageType;
}

const DEFAULT_SCALE = '2';
export const ExportImageDialog: React.FC<ExportImageDialogProps> = ({
    dialog,
    format,
}) => {
    const { t } = useTranslation();
    const [scale, setScale] = useState<string>(DEFAULT_SCALE);
    const { exportImage } = useExportImage();

    useEffect(() => {
        if (!dialog.open) return;
        setScale(DEFAULT_SCALE);
    }, [dialog.open]);
    const { closeExportImageDialog } = useDialog();

    const handleExport = useCallback(() => {
        exportImage(format, Number(scale));
    }, [exportImage, format, scale]);

    const scaleOptions: SelectBoxOption[] = useMemo(
        () =>
            ['1', '2', '3', '4'].map((scale) => ({
                value: scale,
                label: t(`export_image_dialog.scale_${scale}x`),
            })),
        [t]
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeExportImageDialog();
                }
            }}
        >
            <DialogContent className="flex flex-col" showClose>
                <DialogHeader>
                    <DialogTitle>{t('export_image_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('export_image_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-1">
                    <div className="grid w-full items-center gap-4">
                        <SelectBox
                            options={scaleOptions}
                            multiple={false}
                            value={scale}
                            onChange={(value) => setScale(value as string)}
                        />
                    </div>
                </div>
                <DialogFooter className="flex gap-1 md:justify-between">
                    <DialogClose asChild>
                        <Button variant="secondary">
                            {t('export_image_dialog.cancel')}
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={handleExport}>
                            {t('export_image_dialog.export')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
