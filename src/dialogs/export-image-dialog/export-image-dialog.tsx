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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';

export interface ExportImageDialogProps extends BaseDialogProps {
    format: ImageType;
}

const DEFAULT_INCLUDE_PATTERN_BG = true;
const DEFAULT_TRANSPARENT = false;
const DEFAULT_SCALE = '2';
export const ExportImageDialog: React.FC<ExportImageDialogProps> = ({
    dialog,
    format,
}) => {
    const { t } = useTranslation();
    const [scale, setScale] = useState<string>(DEFAULT_SCALE);
    const [includePatternBG, setIncludePatternBG] = useState<boolean>(
        DEFAULT_INCLUDE_PATTERN_BG
    );
    const [transparent, setTransparent] =
        useState<boolean>(DEFAULT_TRANSPARENT);
    const { exportImage } = useExportImage();

    useEffect(() => {
        if (!dialog.open) return;
        setScale(DEFAULT_SCALE);
        setIncludePatternBG(DEFAULT_INCLUDE_PATTERN_BG);
        setTransparent(DEFAULT_TRANSPARENT);
    }, [dialog.open]);
    const { closeExportImageDialog } = useDialog();

    const handleExport = useCallback(() => {
        exportImage(format, {
            transparent,
            includePatternBG,
            scale: Number(scale),
        });
    }, [exportImage, format, includePatternBG, transparent, scale]);

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
                    <SelectBox
                        options={scaleOptions}
                        multiple={false}
                        value={scale}
                        onChange={(value) => setScale(value as string)}
                    />
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="settings" className="border-0">
                            <AccordionTrigger
                                className="py-1.5"
                                iconPosition="right"
                            >
                                {t('export_image_dialog.advanced_options')}
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-col gap-3 py-2">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="pattern-checkbox"
                                            className="mt-1 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                            checked={includePatternBG}
                                            onCheckedChange={(value) =>
                                                setIncludePatternBG(
                                                    value as boolean
                                                )
                                            }
                                        />
                                        <div className="flex flex-col">
                                            <label
                                                htmlFor="pattern-checkbox"
                                                className="cursor-pointer font-medium"
                                            >
                                                {t(
                                                    'export_image_dialog.pattern'
                                                )}
                                            </label>
                                            <span className="text-sm text-muted-foreground">
                                                {t(
                                                    'export_image_dialog.pattern_description'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="transparent-checkbox"
                                            className="mt-1 data-[state=checked]:border-pink-600 data-[state=checked]:bg-pink-600 data-[state=checked]:text-white"
                                            checked={transparent}
                                            onCheckedChange={(value) =>
                                                setTransparent(value as boolean)
                                            }
                                        />
                                        <div className="flex flex-col">
                                            <label
                                                htmlFor="transparent-checkbox"
                                                className="cursor-pointer font-medium"
                                            >
                                                {t(
                                                    'export_image_dialog.transparent'
                                                )}
                                            </label>
                                            <span className="text-sm text-muted-foreground">
                                                {t(
                                                    'export_image_dialog.transparent_description'
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
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
