import React, { useMemo, useState } from 'react';
import { ToggleGroup } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { DatabaseOption } from './database-option';
import { ExampleOption } from './example-option';
import { Button } from '@/components/button/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
export interface SelectDatabaseContentProps {
    databaseType: DatabaseType;
    setDatabaseType: React.Dispatch<React.SetStateAction<DatabaseType>>;
    onContinue: () => void;
}

const ROW_SIZE = 3;
const ROWS = 2;
const TOTAL_SLOTS = ROW_SIZE * ROWS;
const SUPPORTED_DB_TYPES: DatabaseType[] = [
    DatabaseType.MYSQL,
    DatabaseType.POSTGRESQL,
    DatabaseType.MARIADB,
    DatabaseType.SQLITE,
    DatabaseType.SQL_SERVER,
    DatabaseType.ORACLE,
    DatabaseType.COCKROACHDB,
    DatabaseType.CLICKHOUSE,
];

export const SelectDatabaseContent: React.FC<SelectDatabaseContentProps> = ({
    databaseType,
    setDatabaseType,
    onContinue,
}) => {
    const [currentRow, setCurrentRow] = useState(0);
    const currentDatabasesTypes = useMemo(
        () =>
            SUPPORTED_DB_TYPES.slice(
                currentRow * ROW_SIZE,
                currentRow * ROW_SIZE + TOTAL_SLOTS
            ),
        [currentRow]
    );

    const hasNextRow = useMemo(
        () => (currentRow + 1) * ROW_SIZE < SUPPORTED_DB_TYPES.length,
        [currentRow]
    );

    const hasPreviousRow = useMemo(() => currentRow > 0, [currentRow]);

    const toggleRow = () => {
        if (currentRow === 0 && hasNextRow) {
            setCurrentRow(currentRow + 1);
        } else if (currentRow > 0) {
            setCurrentRow(currentRow - 1);
        }
    };

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
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
                {Array.from({ length: TOTAL_SLOTS }).map((_, index) =>
                    currentDatabasesTypes?.[index] ? (
                        <DatabaseOption
                            key={currentDatabasesTypes[index]}
                            type={currentDatabasesTypes[index]}
                        />
                    ) : null
                )}

                <div className="col-span-3 flex flex-1 flex-col gap-1">
                    {hasNextRow || hasPreviousRow ? (
                        <Button
                            variant="ghost"
                            onClick={toggleRow}
                            className="col-span-3 h-8"
                        >
                            {currentRow === 0 ? (
                                <div className="flex h-8 w-full cursor-pointer flex-row items-center justify-center gap-2 py-3 text-center md:h-12">
                                    <ChevronDown className="mr-2 size-3.5" />
                                    <span className="text-xs">
                                        More Databases
                                    </span>
                                </div>
                            ) : (
                                <div className="flex h-8 w-full cursor-pointer flex-row items-center justify-center gap-2 py-3 text-center md:h-12">
                                    <ChevronUp className="mr-2 size-3.5" />
                                    <span className="text-xs">
                                        Primary Databases
                                    </span>
                                </div>
                            )}
                        </Button>
                    ) : null}
                    <ExampleOption />
                </div>
            </ToggleGroup>
        </div>
    );
};
