import React, { useMemo } from 'react';
import { AlertCircle, Ellipsis, Trash2 } from 'lucide-react';
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
import { validateCheckConstraintWithDetails } from '@/lib/check-constraints/check-constraints-validator';

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

    // Validate the expression and memoize the result
    const validationResult = useMemo(() => {
        // Empty expressions are allowed (user might be in the middle of typing)
        if (!constraint.expression || !constraint.expression.trim()) {
            return { isValid: true };
        }
        return validateCheckConstraintWithDetails(constraint.expression);
    }, [constraint.expression]);

    const hasError = !validationResult.isValid;

    return (
        <div className="flex flex-1 flex-row items-center justify-between gap-1 py-0.5">
            <div
                className={`flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border bg-slate-50 px-2.5 dark:bg-slate-900 ${
                    hasError
                        ? 'border-red-300 dark:border-red-700'
                        : 'border-input'
                }`}
            >
                {hasError && (
                    <AlertCircle className="size-3 shrink-0 text-red-500" />
                )}
                <code
                    className={`min-w-0 flex-1 truncate font-mono text-xs ${
                        hasError
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-700 dark:text-slate-300'
                    }`}
                >
                    {constraint.expression || (
                        <span className="italic text-slate-400 dark:text-slate-500">
                            empty
                        </span>
                    )}
                </code>
            </div>
            <div className="flex shrink-0">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="size-8 p-2 text-slate-500 hover:bg-primary-foreground hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
                                    className={`min-h-[60px] font-mono text-xs ${
                                        hasError
                                            ? 'border-red-500 focus-visible:ring-red-500'
                                            : ''
                                    }`}
                                    placeholder="e.g., price > 0"
                                />
                                {hasError && validationResult.error && (
                                    <div className="flex items-start gap-1.5 text-xs text-red-600 dark:text-red-400">
                                        <AlertCircle className="mt-0.5 size-3 shrink-0" />
                                        <span>{validationResult.error}</span>
                                    </div>
                                )}
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
