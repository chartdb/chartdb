import React, { useMemo } from 'react';
import { ToggleGroupItem } from '@/components/toggle/toggle-group';
import type { DatabaseType } from '@/lib/domain/database-type';
import { databaseTypeToLabelMap, getDatabaseLogo } from '@/lib/databases';
import { useTheme } from '@/hooks/use-theme';

export interface DatabaseOptionProps {
    type: DatabaseType;
}

export const DatabaseOption: React.FC<DatabaseOptionProps> = ({ type }) => {
    const { effectiveTheme } = useTheme();
    const logo = useMemo(
        () => getDatabaseLogo(type, effectiveTheme),
        [type, effectiveTheme]
    );

    return (
        <ToggleGroupItem
            value={type}
            aria-label="Toggle bold"
            className="flex size-20 md:size-32"
        >
            <img src={logo} alt={databaseTypeToLabelMap[type]} />
        </ToggleGroupItem>
    );
};
