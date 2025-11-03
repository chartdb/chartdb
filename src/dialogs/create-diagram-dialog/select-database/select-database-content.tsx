import React, { useCallback, useMemo, useState } from 'react';
import { ToggleGroup } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { DatabaseOption } from './database-option';
import { ExampleOption } from './example-option';
import { Button } from '@/components/button/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/tabs/tabs';
export interface SelectDatabaseContentProps {
    databaseType: DatabaseType;
    setDatabaseType: React.Dispatch<React.SetStateAction<DatabaseType>>;
    onContinue: (selectedDatabaseType: DatabaseType) => void;
}

const ROW_SIZE = 3;
const ROWS = 2;
const TOTAL_SLOTS = ROW_SIZE * ROWS;

// Transactional databases - OLTP systems optimized for frequent read/write operations
const TRANSACTIONAL_DB_TYPES: DatabaseType[] = [
    DatabaseType.MYSQL,
    DatabaseType.POSTGRESQL,
    DatabaseType.MARIADB,
    DatabaseType.SQLITE,
    DatabaseType.SQL_SERVER,
    DatabaseType.ORACLE,
    DatabaseType.COCKROACHDB,
];

// Analytical databases - OLAP systems optimized for complex queries and analytics
const ANALYTICAL_DB_TYPES: DatabaseType[] = [DatabaseType.CLICKHOUSE];

export const SelectDatabaseContent: React.FC<SelectDatabaseContentProps> = ({
    databaseType,
    setDatabaseType,
    onContinue,
}) => {
    const [activeTab, setActiveTab] = useState<'transactional' | 'analytical'>(
        'transactional'
    );
    const [currentRow, setCurrentRow] = useState(0);

    const currentDbTypes =
        activeTab === 'transactional'
            ? TRANSACTIONAL_DB_TYPES
            : ANALYTICAL_DB_TYPES;

    const currentDatabasesTypes = useMemo(
        () =>
            currentDbTypes.slice(
                currentRow * ROW_SIZE,
                currentRow * ROW_SIZE + TOTAL_SLOTS
            ),
        [currentRow, currentDbTypes]
    );

    const hasNextRow = useMemo(
        () => (currentRow + 1) * ROW_SIZE < currentDbTypes.length,
        [currentRow, currentDbTypes]
    );

    const hasPreviousRow = useMemo(() => currentRow > 0, [currentRow]);

    const toggleRow = useCallback(() => {
        if (currentRow === 0 && hasNextRow) {
            setCurrentRow(currentRow + 1);
        } else if (currentRow > 0) {
            setCurrentRow(currentRow - 1);
        }
    }, [currentRow, hasNextRow]);

    const handleTabChange = useCallback((value: string) => {
        setActiveTab(value as 'transactional' | 'analytical');
        setCurrentRow(0); // Reset to first row when switching tabs
    }, []);

    const renderDatabaseGrid = useCallback(
        () => (
            <div className="flex min-h-[280px] flex-col md:min-h-[370px]">
                <ToggleGroup
                    value={databaseType}
                    onValueChange={(value: DatabaseType) => {
                        if (!value) {
                            setDatabaseType(DatabaseType.GENERIC);
                        } else {
                            setDatabaseType(value);
                            onContinue(value);
                        }
                    }}
                    type="single"
                    className="grid grid-flow-row grid-cols-3 content-start gap-4"
                >
                    {Array.from({ length: TOTAL_SLOTS }).map((_, index) =>
                        currentDatabasesTypes?.[index] ? (
                            <DatabaseOption
                                key={currentDatabasesTypes[index]}
                                type={currentDatabasesTypes[index]}
                            />
                        ) : null
                    )}
                </ToggleGroup>

                <div className="mt-auto flex flex-col gap-1 pt-4">
                    {hasNextRow || hasPreviousRow ? (
                        <Button
                            variant="ghost"
                            onClick={toggleRow}
                            className="h-8"
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
            </div>
        ),
        [
            databaseType,
            currentDatabasesTypes,
            hasNextRow,
            hasPreviousRow,
            onContinue,
            setDatabaseType,
            toggleRow,
            currentRow,
        ]
    );

    return (
        <div className="flex flex-1 flex-col items-center gap-2">
            <Tabs
                defaultValue="transactional"
                value={activeTab}
                onValueChange={handleTabChange}
                className="w-auto"
            >
                <TabsList className="mb-2 grid size-auto grid-cols-2 gap-1 rounded-xl border bg-background p-1">
                    <TabsTrigger
                        value="transactional"
                        className="gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground dark:data-[state=active]:bg-sky-500"
                    >
                        Transactional
                    </TabsTrigger>
                    <TabsTrigger
                        value="analytical"
                        className="gap-1.5 rounded-lg px-3 py-1 text-sm font-medium transition-all data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=inactive]:text-muted-foreground data-[state=active]:shadow-sm data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-foreground dark:data-[state=active]:bg-sky-500"
                    >
                        Analytical
                    </TabsTrigger>
                </TabsList>
                <TabsContent
                    value="transactional"
                    className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                    {renderDatabaseGrid()}
                </TabsContent>
                <TabsContent
                    value="analytical"
                    className="mt-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                >
                    {renderDatabaseGrid()}
                </TabsContent>
            </Tabs>
        </div>
    );
};
