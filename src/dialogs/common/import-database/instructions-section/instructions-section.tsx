import React from 'react';
import logo from '@/assets/logo-2.png';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { databaseSecondaryLogoMap } from '@/lib/databases';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import {
    databaseEditionToImageMap,
    databaseEditionToLabelMap,
    databaseTypeToEditionMap,
} from '@/lib/domain/database-edition';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';
import { useTranslation } from 'react-i18next';
import { Code } from 'lucide-react';
import { SmartQueryInstructions } from './instructions/smart-query-instructions';
import { DDLInstructions } from './instructions/ddl-instructions';

const DatabasesWithoutDDLInstructions: DatabaseType[] = [
    DatabaseType.CLICKHOUSE,
];

export interface InstructionsSectionProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    setDatabaseEdition: React.Dispatch<
        React.SetStateAction<DatabaseEdition | undefined>
    >;
    importMethod: 'query' | 'ddl';
    setImportMethod: (method: 'query' | 'ddl') => void;
    showSSMSInfoDialog: boolean;
    setShowSSMSInfoDialog: (show: boolean) => void;
}

export const InstructionsSection: React.FC<InstructionsSectionProps> = ({
    databaseType,
    databaseEdition,
    setDatabaseEdition,
    importMethod,
    setImportMethod,
    setShowSSMSInfoDialog,
    showSSMSInfoDialog,
}) => {
    const { t } = useTranslation();

    return (
        <div className="flex w-full flex-1 flex-col gap-4">
            {databaseTypeToEditionMap[databaseType].length > 0 ? (
                <div className="flex flex-col gap-1">
                    <p className="text-sm leading-6 text-primary">
                        {t(
                            'new_diagram_dialog.import_database.database_edition'
                        )}
                    </p>
                    <ToggleGroup
                        type="single"
                        className="ml-1 flex-wrap justify-start gap-2"
                        value={!databaseEdition ? 'regular' : databaseEdition}
                        onValueChange={(value) => {
                            setDatabaseEdition(
                                value === 'regular'
                                    ? undefined
                                    : (value as DatabaseEdition)
                            );
                        }}
                    >
                        <ToggleGroupItem
                            value="regular"
                            variant="outline"
                            className="h-6 gap-1 p-0 px-2 shadow-none data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-slate-700"
                        >
                            <Avatar className="size-4 rounded-none">
                                <AvatarImage
                                    src={databaseSecondaryLogoMap[databaseType]}
                                    alt="Regular"
                                />
                                <AvatarFallback>Regular</AvatarFallback>
                            </Avatar>
                            Regular
                        </ToggleGroupItem>
                        {databaseTypeToEditionMap[databaseType].map(
                            (edition) => (
                                <ToggleGroupItem
                                    value={edition}
                                    key={edition}
                                    variant="outline"
                                    className="h-6 gap-1 p-0 px-2 shadow-none data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-slate-700"
                                >
                                    <Avatar className="size-4">
                                        <AvatarImage
                                            src={
                                                databaseEditionToImageMap[
                                                    edition
                                                ]
                                            }
                                            alt={
                                                databaseEditionToLabelMap[
                                                    edition
                                                ]
                                            }
                                        />
                                        <AvatarFallback>
                                            {databaseEditionToLabelMap[edition]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {databaseEditionToLabelMap[edition]}
                                </ToggleGroupItem>
                            )
                        )}
                    </ToggleGroup>
                </div>
            ) : null}

            {DatabasesWithoutDDLInstructions.includes(databaseType) ? null : (
                <div className="flex flex-col gap-1">
                    <p className="text-sm leading-6 text-primary">
                        How would you like to import?
                    </p>
                    <ToggleGroup
                        type="single"
                        className="ml-1 flex-wrap justify-start gap-2"
                        value={importMethod}
                        onValueChange={(value) => {
                            let selectedImportMethod: 'query' | 'ddl' = 'query';
                            if (value) {
                                selectedImportMethod = value as 'query' | 'ddl';
                            }

                            setImportMethod(selectedImportMethod);
                        }}
                    >
                        <ToggleGroupItem
                            value="query"
                            variant="outline"
                            className="h-6 gap-1 p-0 px-2 shadow-none data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-slate-700"
                        >
                            <Avatar className="h-3 w-4 rounded-none">
                                <AvatarImage src={logo} alt="query" />
                                <AvatarFallback>Query</AvatarFallback>
                            </Avatar>
                            Smart Query
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="ddl"
                            variant="outline"
                            className="h-6 gap-1 p-0 px-2 shadow-none data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-slate-700"
                        >
                            <Avatar className="size-4 rounded-none">
                                <Code size={16} />
                            </Avatar>
                            DDL
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>
            )}

            <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold">Instructions:</div>
                {importMethod === 'query' ? (
                    <SmartQueryInstructions
                        databaseType={databaseType}
                        databaseEdition={databaseEdition}
                        showSSMSInfoDialog={showSSMSInfoDialog}
                        setShowSSMSInfoDialog={setShowSSMSInfoDialog}
                    />
                ) : (
                    <DDLInstructions
                        databaseType={databaseType}
                        databaseEdition={databaseEdition}
                    />
                )}
            </div>
        </div>
    );
};
