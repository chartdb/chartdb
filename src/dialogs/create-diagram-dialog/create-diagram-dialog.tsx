import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import { useStorage } from '@/hooks/use-storage';
import { loadFromDatabaseMetadata } from '@/lib/domain/diagram';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import { loadDatabaseMetadata } from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { generateDiagramId } from '@/lib/utils';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { SelectDatabase } from './select-database/select-database';
import { CreateDiagramDialogStep } from './create-diagram-dialog-step';
import { ImportDatabase } from '../common/import-database/import-database';
import { useTranslation } from 'react-i18next';
import { BaseDialogProps } from '../common/base-dialog-props';
import { Toast } from '@/components/toast'; // hypothetical toast component

export interface CreateDiagramDialogProps extends BaseDialogProps {}

export const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
    dialog,
}) => {
    const { diagramId } = useChartDB();
    const { t } = useTranslation();
    const [databaseType, setDatabaseType] = useState<DatabaseType>(DatabaseType.GENERIC);
    const { closeCreateDiagramDialog } = useDialog();
    const { updateConfig } = useConfig();
    const [scriptResult, setScriptResult] = useState('');
    const [databaseEdition, setDatabaseEdition] = useState<DatabaseEdition | undefined>();
    const [step, setStep] = useState<CreateDiagramDialogStep>(CreateDiagramDialogStep.SELECT_DATABASE);
    const { listDiagrams, addDiagram } = useStorage();
    const [diagramNumber, setDiagramNumber] = useState<number>(1);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string>('');

    useEffect(() => {
        const fetchDiagrams = async () => {
            setLoading(true);
            try {
                const diagrams = await listDiagrams();
                setDiagramNumber(diagrams.length + 1);
            } catch (error) {
                setMessage(t('error.fetch_diagrams'));
            } finally {
                setLoading(false);
            }
        };
        fetchDiagrams();
    }, [listDiagrams, setDiagramNumber, dialog.open]);

    useEffect(() => {
        setStep(CreateDiagramDialogStep.SELECT_DATABASE);
        setDatabaseType(DatabaseType.GENERIC);
        setDatabaseEdition(undefined);
        setScriptResult('');
    }, [dialog.open]);

    const hasExistingDiagram = (diagramId ?? '').trim().length !== 0;

    const importNewDiagram = useCallback(async () => {
        if (!scriptResult) {
            setMessage(t('error.empty_script'));
            return;
        }
        const databaseMetadata: DatabaseMetadata = loadDatabaseMetadata(scriptResult);

        const diagram = loadFromDatabaseMetadata({
            databaseType,
            databaseMetadata,
            diagramNumber,
            databaseEdition: databaseEdition?.trim().length === 0 ? undefined : databaseEdition,
        });

        setLoading(true);
        try {
            await addDiagram({ diagram });
            await updateConfig({ defaultDiagramId: diagram.id });
            closeCreateDiagramDialog();
            navigate(`/diagrams/${diagram.id}`);
            setMessage(t('success.diagram_created'));
        } catch (error) {
            setMessage(t('error.create_diagram'));
        } finally {
            setLoading(false);
        }
    }, [databaseType, addDiagram, databaseEdition, closeCreateDiagramDialog, navigate, updateConfig, scriptResult, diagramNumber, t]);

    const createEmptyDiagram = useCallback(async () => {
        const diagram: Diagram = {
            id: generateDiagramId(),
            name: `Diagram ${diagramNumber}`,
            databaseType: databaseType ?? DatabaseType.GENERIC,
            databaseEdition: databaseEdition?.trim().length === 0 ? undefined : databaseEdition,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        setLoading(true);
        try {
            await addDiagram({ diagram });
            await updateConfig({ defaultDiagramId: diagram.id });
            closeCreateDiagramDialog();
            navigate(`/diagrams/${diagram.id}`);
            setMessage(t('success.diagram_created'));
        } catch (error) {
            setMessage(t('error.create_diagram'));
        } finally {
            setLoading(false);
        }
    }, [databaseType, addDiagram, databaseEdition, closeCreateDiagramDialog, navigate, updateConfig, diagramNumber, t]);

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
                className="flex max-h-[90vh] w-[90vw] flex-col overflow-y-auto md:overflow-visible xl:min-w-[45vw]"
                showClose={hasExistingDiagram}
            >
                {loading && <div className="loading-spinner" />} {/* Add a loading spinner */}
                {message && <Toast message={message} />} {/* Display messages using a toast component */}
                {step === CreateDiagramDialogStep.SELECT_DATABASE ? (
                    <SelectDatabase
                        createNewDiagram={createEmptyDiagram}
                        databaseType={databaseType}
                        hasExistingDiagram={hasExistingDiagram}
                        setDatabaseType={setDatabaseType}
                        onContinue={() => setStep(CreateDiagramDialogStep.IMPORT_DATABASE)}
                    />
                ) : (
                    <ImportDatabase
                        onImport={importNewDiagram}
                        onCreateEmptyDiagram={createEmptyDiagram}
                        databaseEdition={databaseEdition}
                        databaseType={databaseType}
                        scriptResult={scriptResult}
                        setDatabaseEdition={setDatabaseEdition}
                        goBack={() => setStep(CreateDiagramDialogStep.SELECT_DATABASE)}
                        setScriptResult={setScriptResult}
                        title={t('new_diagram_dialog.import_database.title')}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
