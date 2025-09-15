import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import { loadFromDatabaseMetadata } from '@/lib/data/import-metadata/import';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import type { DatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { loadDatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { generateDiagramId } from '@/lib/utils';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { SelectDatabase } from './select-database/select-database';
import { CreateDiagramDialogStep } from './create-diagram-dialog-step';
import { ImportDatabase } from '../common/import-database/import-database';
import { SelectTables } from '../common/select-tables/select-tables';
import { useTranslation } from 'react-i18next';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { sqlImportToDiagram } from '@/lib/data/sql-import';
import type { SelectedTable } from '@/lib/data/import-metadata/filter-metadata';
import { filterMetadataByTables } from '@/lib/data/import-metadata/filter-metadata';
import { MAX_TABLES_WITHOUT_SHOWING_FILTER } from '../common/select-tables/constants';
import {
    defaultDBMLDiagramName,
    importDBMLToDiagram,
} from '@/lib/dbml/dbml-import/dbml-import';
import type { ImportMethod } from '@/lib/import-method/import-method';

export interface CreateDiagramDialogProps extends BaseDialogProps {}

export const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
    dialog,
}) => {
    const { diagramId } = useChartDB();
    const { t } = useTranslation();
    const [importMethod, setImportMethod] = useState<ImportMethod>('query');
    const [databaseType, setDatabaseType] = useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const { closeCreateDiagramDialog } = useDialog();
    const { updateConfig } = useConfig();
    const [scriptResult, setScriptResult] = useState('');
    const [databaseEdition, setDatabaseEdition] = useState<
        DatabaseEdition | undefined
    >();
    const [step, setStep] = useState<CreateDiagramDialogStep>(
        CreateDiagramDialogStep.SELECT_DATABASE
    );
    const { listDiagrams, addDiagram } = useStorage();
    const [diagramNumber, setDiagramNumber] = useState<number>(1);
    const navigate = useNavigate();
    const [parsedMetadata, setParsedMetadata] = useState<DatabaseMetadata>();
    const [isParsingMetadata, setIsParsingMetadata] = useState(false);

    useEffect(() => {
        setDatabaseEdition(undefined);
        setImportMethod('query');
    }, [databaseType]);

    useEffect(() => {
        const fetchDiagrams = async () => {
            const diagrams = await listDiagrams();
            setDiagramNumber(diagrams.length + 1);
        };
        fetchDiagrams();
    }, [listDiagrams, setDiagramNumber, dialog.open]);

    useEffect(() => {
        setStep(CreateDiagramDialogStep.SELECT_DATABASE);
        setDatabaseType(DatabaseType.GENERIC);
        setDatabaseEdition(undefined);
        setScriptResult('');
        setImportMethod('query');
        setParsedMetadata(undefined);
    }, [dialog.open]);

    const hasExistingDiagram = (diagramId ?? '').trim().length !== 0;

    const importNewDiagram = useCallback(
        async ({
            selectedTables,
            databaseMetadata,
        }: {
            selectedTables?: SelectedTable[];
            databaseMetadata?: DatabaseMetadata;
        } = {}) => {
            let diagram: Diagram | undefined;

            if (importMethod === 'ddl') {
                diagram = await sqlImportToDiagram({
                    sqlContent: scriptResult,
                    sourceDatabaseType: databaseType,
                    targetDatabaseType: databaseType,
                });
            } else if (importMethod === 'dbml') {
                diagram = await importDBMLToDiagram(scriptResult, {
                    databaseType,
                });
                // Update the diagram name if it's the default
                if (diagram.name === defaultDBMLDiagramName) {
                    diagram.name = `Diagram ${diagramNumber}`;
                }
            } else {
                let metadata: DatabaseMetadata | undefined = databaseMetadata;

                if (!metadata) {
                    metadata = loadDatabaseMetadata(scriptResult);
                }

                if (selectedTables && selectedTables.length > 0) {
                    metadata = filterMetadataByTables({
                        metadata,
                        selectedTables,
                    });
                }

                diagram = await loadFromDatabaseMetadata({
                    databaseType,
                    databaseMetadata: metadata,
                    diagramNumber,
                    databaseEdition:
                        databaseEdition?.trim().length === 0
                            ? undefined
                            : databaseEdition,
                });
            }

            await addDiagram({ diagram });
            await updateConfig({
                config: { defaultDiagramId: diagram.id },
            });

            closeCreateDiagramDialog();
            navigate(`/diagrams/${diagram.id}`);
        },
        [
            importMethod,
            databaseType,
            addDiagram,
            databaseEdition,
            closeCreateDiagramDialog,
            navigate,
            updateConfig,
            scriptResult,
            diagramNumber,
        ]
    );

    const createEmptyDiagram = useCallback(async () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: `Diagram ${diagramNumber}`,
            databaseType: databaseType ?? DatabaseType.GENERIC,
            databaseEdition:
                databaseEdition?.trim().length === 0
                    ? undefined
                    : databaseEdition,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await addDiagram({ diagram });
        await updateConfig({ config: { defaultDiagramId: diagram.id } });
        closeCreateDiagramDialog();
        navigate(`/diagrams/${diagram.id}`);
    }, [
        databaseType,
        addDiagram,
        databaseEdition,
        closeCreateDiagramDialog,
        navigate,
        updateConfig,
        diagramNumber,
    ]);

    const importNewDiagramOrFilterTables = useCallback(async () => {
        try {
            setIsParsingMetadata(true);

            if (importMethod === 'ddl' || importMethod === 'dbml') {
                await importNewDiagram();
            } else {
                // Parse metadata asynchronously to avoid blocking the UI
                const metadata = await new Promise<DatabaseMetadata>(
                    (resolve, reject) => {
                        setTimeout(() => {
                            try {
                                const result =
                                    loadDatabaseMetadata(scriptResult);
                                resolve(result);
                            } catch (err) {
                                reject(err);
                            }
                        }, 0);
                    }
                );

                const totalTablesAndViews =
                    metadata.tables.length + (metadata.views?.length || 0);

                setParsedMetadata(metadata);

                // Check if it's a large database that needs table selection
                if (totalTablesAndViews > MAX_TABLES_WITHOUT_SHOWING_FILTER) {
                    setStep(CreateDiagramDialogStep.SELECT_TABLES);
                } else {
                    await importNewDiagram({
                        databaseMetadata: metadata,
                    });
                }
            }
        } finally {
            setIsParsingMetadata(false);
        }
    }, [importMethod, scriptResult, importNewDiagram]);

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                // Don't allow closing while parsing metadata
                if (isParsingMetadata) {
                    return;
                }

                if (!hasExistingDiagram) {
                    return;
                }

                if (!open) {
                    closeCreateDiagramDialog();
                }
            }}
        >
            <DialogContent
                className="flex max-h-dvh w-full flex-col md:max-w-[900px]"
                showClose={hasExistingDiagram}
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {step === CreateDiagramDialogStep.SELECT_DATABASE ? (
                    <SelectDatabase
                        createNewDiagram={createEmptyDiagram}
                        databaseType={databaseType}
                        hasExistingDiagram={hasExistingDiagram}
                        setDatabaseType={setDatabaseType}
                        onContinue={() =>
                            setStep(CreateDiagramDialogStep.IMPORT_DATABASE)
                        }
                    />
                ) : step === CreateDiagramDialogStep.IMPORT_DATABASE ? (
                    <ImportDatabase
                        onImport={importNewDiagramOrFilterTables}
                        onCreateEmptyDiagram={createEmptyDiagram}
                        databaseEdition={databaseEdition}
                        databaseType={databaseType}
                        scriptResult={scriptResult}
                        setDatabaseEdition={setDatabaseEdition}
                        goBack={() =>
                            setStep(CreateDiagramDialogStep.SELECT_DATABASE)
                        }
                        setScriptResult={setScriptResult}
                        title={t('new_diagram_dialog.import_database.title')}
                        importMethod={importMethod}
                        setImportMethod={setImportMethod}
                        keepDialogAfterImport={true}
                    />
                ) : step === CreateDiagramDialogStep.SELECT_TABLES ? (
                    <SelectTables
                        isLoading={isParsingMetadata || !parsedMetadata}
                        databaseMetadata={parsedMetadata}
                        onImport={importNewDiagram}
                        onBack={() =>
                            setStep(CreateDiagramDialogStep.IMPORT_DATABASE)
                        }
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
