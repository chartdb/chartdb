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
import { Checkbox } from '@/components/checkbox/checkbox';

export interface ExportImageDialogProps extends BaseDialogProps {
    format: ImageType;
}

const DEFAULT_HAS_PATTERN = true;
const DEFAULT_TRANSPARENT = false;
const DEFAULT_WATERMARK = true;
const DEFAULT_SCALE = '2';
export const ExportImageDialog: React.FC<ExportImageDialogProps> = ({
    dialog,
    format,
}) => {
    const { t } = useTranslation();
    const [scale, setScale] = useState<string>(DEFAULT_SCALE);
    const [hasPattern, setHasPattern] = useState<boolean>(DEFAULT_HAS_PATTERN);
    const [isTransparent, setIsTransparent] =
        useState<boolean>(DEFAULT_TRANSPARENT);
    const [hasWatermark, setHasWatermark] =
        useState<boolean>(DEFAULT_WATERMARK);
    const { exportImage } = useExportImage();

    useEffect(() => {
        if (!dialog.open) return;
        setScale(DEFAULT_SCALE);
        setHasPattern(DEFAULT_HAS_PATTERN);
        setIsTransparent(DEFAULT_TRANSPARENT);
        setHasWatermark(DEFAULT_WATERMARK);
    }, [dialog.open]);
    const { closeExportImageDialog } = useDialog();

    const handleExport = useCallback(() => {
        exportImage(
            format,
            Boolean(hasPattern),
            Boolean(isTransparent),
            Boolean(hasWatermark),
            Number(scale)
        );
    }, [exportImage, format, hasPattern, isTransparent, hasWatermark, scale]);

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
                <div className="flex flex-col gap-4 py-1">
                    <div className="flex flex-col gap-2">
                        <span className="font-semibold">
                            {t('export_image_dialog.scale')}
                        </span>
                        <SelectBox
                            options={scaleOptions}
                            multiple={false}
                            value={scale}
                            onChange={(value) => setScale(value as string)}
                        />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {t('export_image_dialog.pattern')}
                            </span>
                            <Checkbox
                                className="data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                checked={hasPattern}
                                onCheckedChange={(value) =>
                                    setHasPattern(value as boolean)
                                }
                            />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {t('export_image_dialog.pattern_description')}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {t('export_image_dialog.transparent')}
                            </span>
                            <Checkbox
                                className="data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                checked={isTransparent}
                                onCheckedChange={(value) =>
                                    setIsTransparent(value as boolean)
                                }
                            />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {t('export_image_dialog.transparent_description')}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">
                                {t('export_image_dialog.watermark')}
                            </span>
                            <Checkbox
                                className="data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                checked={hasWatermark}
                                onCheckedChange={(value) =>
                                    setHasWatermark(value as boolean)
                                }
                            />
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {t('export_image_dialog.watermark_description')}
                        </span>
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
