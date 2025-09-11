import React, { useEffect, useMemo, useRef } from 'react';
import { useDialog } from '@/hooks/use-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/dialog/dialog';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/input/input';
import { Button } from '@/components/button/button';
import { Copy } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { useToast } from '@/components/toast/use-toast';

export interface ShareTableDialogProps extends BaseDialogProps {
    tableId: string;
}

export const ShareTableDialog: React.FC<ShareTableDialogProps> = ({
    dialog,
    tableId,
}) => {
    const { closeShareTableDialog } = useDialog();
    const { t } = useTranslation();
    const { toast } = useToast();
    const inputRef = useRef<HTMLInputElement>(null);

    const shareUrl = useMemo(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('clean', 'true');
        url.searchParams.set('table', tableId);
        return url.toString();
    }, [tableId]);

    useEffect(() => {
        if (dialog.open) {
            setTimeout(() => {
                inputRef.current?.select();
            }, 0);
        }
    }, [dialog.open]);

    const handleCopy = async () => {
        inputRef.current?.select();
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast({ title: t('copied') });
        } catch {
            // ignore error, selection already made
        }
    };

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeShareTableDialog();
                }
            }}
        >
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{t('share_table_dialog.title')}</DialogTitle>
                    <DialogDescription>
                        {t('share_table_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 py-4">
                    <Input
                        ref={inputRef}
                        value={shareUrl}
                        readOnly
                        className="min-w-[400px] flex-1"
                    />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="secondary"
                                onClick={handleCopy}
                                className="shrink-0 p-2"
                            >
                                <Copy className="size-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {t('copy_to_clipboard')}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <DialogFooter className="sm:justify-end">
                    <DialogClose asChild>
                        <Button variant="outline">
                            {t('share_table_dialog.close')}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
