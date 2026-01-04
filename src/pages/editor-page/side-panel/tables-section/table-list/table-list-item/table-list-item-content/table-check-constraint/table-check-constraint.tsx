import React from 'react';
import { Ellipsis, Trash2 } from 'lucide-react';
import { Button } from '@/components/button/button';
import type { DBCheckConstraint } from '@/lib/domain/db-check-constraint';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/popover/popover';
import { Separator } from '@/components/separator/separator';
import { Label } from '@/components/label/label';
import { Textarea } from '@/components/textarea/textarea';
import { useTranslation } from 'react-i18next';
import { useChartDB } from '@/hooks/use-chartdb';

export interface TableCheckConstraintProps {
    constraint: DBCheckConstraint;
    updateConstraint: (attrs: Partial<DBCheckConstraint>) => void;
    removeConstraint: () => void;
}

export const TableCheckConstraint: React.FC<TableCheckConstraintProps> = ({
    constraint,
    updateConstraint,
    removeConstraint,
}) => {
    const { t } = useTranslation();
    const { readonly } = useChartDB();

    return (
        <div className="flex flex-1 flex-row items-center justify-between gap-2 p-1">
            <code className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-400">
                {constraint.expression || '(empty)'}
            </code>
            <div className="flex shrink-0 gap-1">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-[32px] p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                        >
                            <Ellipsis className="size-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-semibold">
                                {t(
                                    'side_panel.tables_section.table.check_constraint_actions.title'
                                )}
                            </div>
                            <Separator orientation="horizontal" />
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="constraint-expression"
                                    className="text-subtitle"
                                >
                                    {t(
                                        'side_panel.tables_section.table.check_constraint_actions.expression'
                                    )}
                                </Label>
                                <Textarea
                                    id="constraint-expression"
                                    value={constraint.expression}
                                    onChange={(e) =>
                                        updateConstraint({
                                            expression: e.target.value,
                                        })
                                    }
                                    readOnly={readonly}
                                    className="min-h-[60px] font-mono text-xs"
                                    placeholder="e.g., price > 0"
                                />
                            </div>
                            {!readonly ? (
                                <>
                                    <Separator orientation="horizontal" />
                                    <Button
                                        variant="outline"
                                        className="flex gap-2 !text-red-700"
                                        onClick={removeConstraint}
                                    >
                                        <Trash2 className="size-3.5 text-red-700" />
                                        {t(
                                            'side_panel.tables_section.table.check_constraint_actions.delete'
                                        )}
                                    </Button>
                                </>
                            ) : null}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};
