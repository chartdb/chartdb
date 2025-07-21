import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import { useStorage } from '@/hooks/use-storage';
import type { Diagram } from '@/lib/domain/diagram';
import { loadFromDatabaseMetadata } from '@/lib/domain/diagram';
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
import { SelectTables } from './select-tables';
import { useTranslation } from 'react-i18next';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { sqlImportToDiagram } from '@/lib/data/sql-import';
import { filterMetadataByTables } from '@/lib/data/import-metadata/filter-metadata';

export interface CreateDiagramDialogProps extends BaseDialogProps {}

export const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
    dialog,
}) => {
    const { diagramId } = useChartDB();
    const { t } = useTranslation();
    const [importMethod, setImportMethod] = useState<'query' | 'ddl'>('query');
    const [databaseType, setDatabaseType] = useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const { closeCreateDiagramDialog, openImportDBMLDialog } = useDialog();
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
    const [parsedMetadata, setParsedMetadata] =
        useState<DatabaseMetadata | null>(null);
    const [selectedTables, setSelectedTables] = useState<string[]>([]);
    const [isParsingMetadata, setIsParsingMetadata] = useState(false);
    const importNewDiagramRef =
        useRef<(tablesToImport?: string[]) => Promise<void>>();
    const prevDialogOpen = useRef(dialog.open);

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
        // Only reset when dialog is opening (transitioning from closed to open)
        if (dialog.open && !prevDialogOpen.current) {
            setStep(CreateDiagramDialogStep.SELECT_DATABASE);
            setDatabaseType(DatabaseType.GENERIC);
            setDatabaseEdition(undefined);
            setScriptResult('');
            setImportMethod('query');
            setParsedMetadata(null);
            setSelectedTables([]);
        }
        prevDialogOpen.current = dialog.open;
    }, [dialog.open]);

    const hasExistingDiagram = (diagramId ?? '').trim().length !== 0;

    const handleTableSelection = useCallback((tables: string[]) => {
        setSelectedTables(tables);
        if (importNewDiagramRef.current) {
            importNewDiagramRef.current(tables);
        }
    }, []);

    const importNewDiagram = useCallback(
        async (tablesToImport?: string[]) => {
            let diagram: Diagram | undefined;

            if (importMethod === 'ddl') {
                diagram = await sqlImportToDiagram({
                    sqlContent: scriptResult,
                    sourceDatabaseType: databaseType,
                    targetDatabaseType: databaseType,
                });
            } else {
                let databaseMetadata: DatabaseMetadata =
                    parsedMetadata || loadDatabaseMetadata(scriptResult);

                // If tables were selected, filter the metadata
                const tables = tablesToImport || selectedTables;
                if (tables && tables.length > 0) {
                    databaseMetadata = filterMetadataByTables(
                        databaseMetadata,
                        tables
                    );
                }

                diagram = await loadFromDatabaseMetadata({
                    databaseType,
                    databaseMetadata,
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
            parsedMetadata,
            selectedTables,
        ]
    );

    // Store the function in the ref so handleTableSelection can access it
    useEffect(() => {
        importNewDiagramRef.current = importNewDiagram;
    }, [importNewDiagram]);

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
        setTimeout(
            () => openImportDBMLDialog({ withCreateEmptyDiagram: true }),
            700
        );
    }, [
        databaseType,
        addDiagram,
        databaseEdition,
        closeCreateDiagramDialog,
        navigate,
        updateConfig,
        diagramNumber,
        openImportDBMLDialog,
    ]);

    const parseMetadata = useCallback(async () => {
        try {
            setIsParsingMetadata(true);

            if (importMethod === 'ddl') {
                // For DDL imports, we can't pre-parse, so go directly to import
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

                // Check if it's a large database that needs table selection
                if (totalTablesAndViews > 50) {
                    setParsedMetadata(metadata);
                    setStep(CreateDiagramDialogStep.SELECT_TABLES);
                    // Don't call importNewDiagram here, wait for user selection
                } else {
                    // Small database, import all tables and views directly
                    setParsedMetadata(metadata);
                    await importNewDiagram();
                }
            }
        } catch {
            alert(
                'Failed to parse database metadata. Please check the format and try again.'
            );
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
                onInteractOutside={(e) => {
                    // Prevent closing by clicking outside
                    e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing by pressing Escape
                    e.preventDefault();
                }}
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
                        onImport={parseMetadata}
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
                    isParsingMetadata ? (
                        <div className="flex h-[400px] items-center justify-center">
                            <div className="text-center">
                                <div className="mb-4 inline-block size-8 animate-spin rounded-full border-b-2 border-primary"></div>
                                <p className="text-sm text-muted-foreground">
                                    Parsing database metadata...
                                </p>
                            </div>
                        </div>
                    ) : parsedMetadata ? (
                        <SelectTables
                            databaseMetadata={parsedMetadata}
                            onConfirm={handleTableSelection}
                            onBack={() =>
                                setStep(CreateDiagramDialogStep.IMPORT_DATABASE)
                            }
                        />
                    ) : null
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
