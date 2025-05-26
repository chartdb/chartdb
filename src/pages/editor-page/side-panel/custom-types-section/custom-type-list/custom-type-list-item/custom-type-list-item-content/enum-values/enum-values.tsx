import { Pause, Plus, X } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/input/input';
import { Button } from '@/components/button/button';

export interface EnumValuesProps {
    values: string[];
    addValue: (value: string) => void;
    removeValue: (value: string) => void;
}

export const CustomTypeEnumValues: React.FC<EnumValuesProps> = ({
    values,
    addValue,
    removeValue,
}) => {
    const { t } = useTranslation();
    const [newValue, setNewValue] = useState('');

    const handleAddValue = useCallback(() => {
        if (newValue.trim() && !values.includes(newValue.trim())) {
            addValue(newValue.trim());
            setNewValue('');
        }
    }, [newValue, values, addValue]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleAddValue();
            }
        },
        [handleAddValue]
    );

    return (
        <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-row items-center gap-1">
                <Pause className="size-4 text-subtitle" />
                <div className="font-bold text-subtitle">
                    {t(
                        'side_panel.custom_types_section.custom_type.enum_values'
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-1">
                {values.map((value, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between gap-1 rounded-md border border-border bg-muted/30 px-2 py-1"
                    >
                        <span className="flex-1 truncate text-sm font-medium">
                            {value}
                        </span>
                        <Button
                            variant="ghost"
                            className="size-6 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeValue(value)}
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-1">
                <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add enum value..."
                    className="h-8 flex-1 text-xs focus-visible:ring-0"
                />
                <Button
                    variant="outline"
                    className="h-8 px-2 text-xs"
                    onClick={handleAddValue}
                    disabled={
                        !newValue.trim() || values.includes(newValue.trim())
                    }
                >
                    <Plus className="size-3.5" />
                </Button>
            </div>
        </div>
    );
};
