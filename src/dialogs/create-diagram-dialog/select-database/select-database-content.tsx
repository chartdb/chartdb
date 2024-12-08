import React, { useState } from 'react';
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

const PAGE_SIZE = 3;
const ROWS = 2;
const TOTAL_SLOTS = PAGE_SIZE * ROWS;

const SUPPORTED_DBS = [
    DatabaseType.MYSQL,
    DatabaseType.POSTGRESQL,
    DatabaseType.MARIADB,
    DatabaseType.SQLITE,
    DatabaseType.SQL_SERVER,
    DatabaseType.COCKROACHDB,
    DatabaseType.CLICKHOUSE,
];

export const SelectDatabaseContent: React.FC<SelectDatabaseContentProps> = ({
    databaseType,
    setDatabaseType,
    onContinue,
}) => {
    const [currentPage, setCurrentPage] = useState(0);

    // Get databases for both rows
    const currentDatabases = SUPPORTED_DBS.slice(
        currentPage * PAGE_SIZE,
        currentPage * PAGE_SIZE + TOTAL_SLOTS
    );

    // Fill remaining slots with null to maintain grid structure
    const filledDatabases = [
        ...currentDatabases,
        ...Array(TOTAL_SLOTS - currentDatabases.length).fill(null),
    ];

    const hasNextPage = (currentPage + 1) * PAGE_SIZE < SUPPORTED_DBS.length;
    const hasPreviousPage = currentPage > 0;

    const togglePage = () => {
        if (currentPage === 0 && hasNextPage) {
            setCurrentPage(currentPage + 1);
        } else if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
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
                className="grid grid-flow-row grid-cols-3 gap-y-2"
            >
                {filledDatabases.map((dbType, index) =>
                    dbType ? (
                        <DatabaseOption key={dbType} type={dbType} />
                    ) : (
                        <div key={`empty-${index}`} className="h-8 md:h-12" />
                    )
                )}

                {(hasNextPage || hasPreviousPage) && (
                    <Button
                        variant="ghost"
                        onClick={togglePage}
                        className="col-span-3"
                    >
                        {currentPage === 0 ? (
                            <div className="flex h-8 w-full cursor-pointer flex-row items-center justify-center gap-2 py-3 text-center md:h-12">
                                <ChevronDown className="mr-2 size-3.5" />
                                <span className="text-xs">More Databases</span>
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
                )}

                <ExampleOption />
            </ToggleGroup>
        </div>
    );
};
