import React from 'react';
import { ToggleGroup } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { DatabaseOption } from './database-option';
import { ExampleOption } from './example-option';

export interface SelectDatabaseContentProps {
    databaseType: DatabaseType;
    setDatabaseType: React.Dispatch<React.SetStateAction<DatabaseType>>;
    onContinue: () => void;
}

export const SelectDatabaseContent: React.FC<SelectDatabaseContentProps> = ({
    databaseType,
    setDatabaseType,
    onContinue,
}) => {
    return (
        <div className="flex flex-1 items-center justify-center">
            <ToggleGroup
                value={databaseType}
                onValueChange={(value: DatabaseType) => {
                    if (!value) {
                        setDatabaseType(DatabaseType.GENERIC);
                    } else {
                        setDatabaseType(value);
                        onContinue();
                    }
                }}
                type="single"
                className="grid grid-flow-row grid-cols-3 gap-6"
            >
                <DatabaseOption type={DatabaseType.MYSQL} />
                <DatabaseOption type={DatabaseType.POSTGRESQL} />
                <DatabaseOption type={DatabaseType.MARIADB} />
                <DatabaseOption type={DatabaseType.SQLITE} />
                <DatabaseOption type={DatabaseType.SQL_SERVER} />
                <ExampleOption />
            </ToggleGroup>
        </div>
    );
};
