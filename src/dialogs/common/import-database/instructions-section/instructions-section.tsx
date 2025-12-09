import React, { useMemo } from 'react';
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
import { Code, FileCode } from 'lucide-react';
import { SmartQueryInstructions } from './instructions/smart-query-instructions';
import { DDLInstructions } from './instructions/ddl-instructions';
import { DBMLInstructions } from './instructions/dbml-instructions';
import type { ImportMethod } from '@/lib/import-method/import-method';

const DatabasesWithoutDDLInstructions: DatabaseType[] = [
    DatabaseType.CLICKHOUSE,
    DatabaseType.ORACLE,
];

export interface InstructionsSectionProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    setDatabaseEdition: React.Dispatch<
        React.SetStateAction<DatabaseEdition | undefined>
    >;
    importMethod: ImportMethod;
    setImportMethod: (method: ImportMethod) => void;
    showSSMSInfoDialog: boolean;
    setShowSSMSInfoDialog: (show: boolean) => void;
    importMethods?: ImportMethod[];
}

const defaultImportMethods: ImportMethod[] = ['query', 'ddl', 'dbml'];

export const InstructionsSection: React.FC<InstructionsSectionProps> = ({
    databaseType,
    databaseEdition,
    setDatabaseEdition,
    importMethod,
    setImportMethod,
    setShowSSMSInfoDialog,
    showSSMSInfoDialog,
    importMethods = defaultImportMethods,
}) => {
    const { t } = useTranslation();

    const showSmartQuery = useMemo(
        () => importMethods.includes('query'),
        [importMethods]
    );
    const showDDL = useMemo(
        () => importMethods.includes('ddl'),
        [importMethods]
    );
    const showDBML = useMemo(
        () => importMethods.includes('dbml'),
        [importMethods]
    );

    return (
        <div className="flex w-full flex-1 flex-col gap-4">
            {showSmartQuery &&
            databaseTypeToEditionMap[databaseType].length > 0 ? (
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

            <div className="flex flex-col gap-1">
                <p className="text-sm leading-6 text-primary">
                    How would you like to import?
                </p>
                <ToggleGroup
                    type="single"
                    className="ml-1 flex-wrap justify-start gap-2"
                    value={importMethod}
                    onValueChange={(value) => {
                        let selectedImportMethod: ImportMethod = 'query';
                        if (value) {
                            selectedImportMethod = value as ImportMethod;
                        }

                        setImportMethod(selectedImportMethod);
                    }}
                >
                    {showSmartQuery && (
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
                    )}
                    {showDDL &&
                        !DatabasesWithoutDDLInstructions.includes(
                            databaseType
                        ) && (
                            <ToggleGroupItem
                                value="ddl"
                                variant="outline"
                                className="h-6 gap-1 p-0 px-2 shadow-none data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-slate-700"
                            >
                                <Avatar className="size-4 rounded-none">
                                    <FileCode size={16} />
                                </Avatar>
                                SQL Script
                            </ToggleGroupItem>
                        )}
                    {showDBML && (
                        <ToggleGroupItem
                            value="dbml"
                            variant="outline"
                            className="h-6 gap-1 p-0 px-2 shadow-none data-[state=on]:bg-slate-200 dark:data-[state=on]:bg-slate-700"
                        >
                            <Avatar className="size-4 rounded-none">
                                <Code size={16} />
                            </Avatar>
                            DBML
                        </ToggleGroupItem>
                    )}
                </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
                <div className="text-sm font-semibold">Instructions:</div>
                {importMethod === 'query' && showSmartQuery ? (
                    <SmartQueryInstructions
                        databaseType={databaseType}
                        databaseEdition={databaseEdition}
                        showSSMSInfoDialog={showSSMSInfoDialog}
                        setShowSSMSInfoDialog={setShowSSMSInfoDialog}
                    />
                ) : importMethod === 'ddl' ? (
                    <DDLInstructions
                        databaseType={databaseType}
                        databaseEdition={databaseEdition}
                    />
                ) : (
                    <DBMLInstructions
                        databaseType={databaseType}
                        databaseEdition={databaseEdition}
                    />
                )}
            </div>
        </div>
    );
};
