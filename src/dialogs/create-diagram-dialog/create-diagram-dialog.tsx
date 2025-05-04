import React, { useCallback, useEffect, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { BaseDialogProps } from '../common/base-dialog-props';
import { sqlImportToDiagram } from '@/lib/data/sql-import';

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
    }, [dialog.open]);

    const hasExistingDiagram = (diagramId ?? '').trim().length !== 0;

    const importNewDiagram = useCallback(async () => {
        let diagram: Diagram | undefined;

        if (importMethod === 'ddl') {
            diagram = await sqlImportToDiagram({
                sqlContent: scriptResult,
                sourceDatabaseType: databaseType,
                targetDatabaseType: databaseType,
            });
        } else {
            const databaseMetadata: DatabaseMetadata =
                loadDatabaseMetadata(scriptResult);

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
        await updateConfig({ defaultDiagramId: diagram.id });
        closeCreateDiagramDialog();
        navigate(`/diagrams/${diagram.id}`);
    }, [
        importMethod,
        databaseType,
        addDiagram,
        databaseEdition,
        closeCreateDiagramDialog,
        navigate,
        updateConfig,
        scriptResult,
        diagramNumber,
    ]);

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
        await updateConfig({ defaultDiagramId: diagram.id });
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

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
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
                ) : (
                    <ImportDatabase
                        onImport={importNewDiagram}
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
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
