import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/dialog/dialog';
import { DialogProps } from '@radix-ui/react-dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import { useStorage } from '@/hooks/use-storage';
import { Diagram, loadFromDatabaseMetadata } from '@/lib/domain/diagram';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import {
    DatabaseMetadata,
    isDatabaseMetadata,
    loadDatabaseMetadata,
} from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { generateId } from '@/lib/utils';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';
import { DatabaseEdition } from '@/lib/domain/database-edition';
import { SelectDatabaseStep } from './select-database-step/select-database-step';
import { CreateDiagramDialogStep } from './create-diagram-dialog-step';
import { ImportDatabaseStep } from './import-database-step/import-database-step';

const errorScriptOutputMessage =
    'Invalid JSON. Please correct it or contact us at chartdb.io@gmail.com for help.';

export interface CreateDiagramDialogProps {
    dialog: DialogProps;
}

export const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
    dialog,
}) => {
    const { diagramId } = useChartDB();
    const [databaseType, setDatabaseType] = useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const { closeCreateDiagramDialog } = useDialog();
    const { updateConfig } = useConfig();
    const [scriptResult, setScriptResult] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
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
        setErrorMessage('');
    }, [dialog.open]);

    useEffect(() => {
        if (scriptResult.trim().length === 0) {
            setErrorMessage('');
            return;
        }

        try {
            const parsedResult = JSON.parse(scriptResult);

            if (isDatabaseMetadata(parsedResult)) {
                setErrorMessage('');
            } else {
                setErrorMessage(errorScriptOutputMessage);
            }
        } catch (error) {
            setErrorMessage(errorScriptOutputMessage);
        }
    }, [scriptResult]);

    const hasExistingDiagram = (diagramId ?? '').trim().length !== 0;

    const createNewDiagram = useCallback(async () => {
        let diagram: Diagram = {
            id: generateId(),
            name: `Diagram ${diagramNumber}`,
            databaseType: databaseType ?? DatabaseType.GENERIC,
            databaseEdition:
                databaseEdition?.trim().length === 0
                    ? undefined
                    : databaseEdition,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (errorMessage.length === 0 && scriptResult.trim().length !== 0) {
            const databaseMetadata: DatabaseMetadata =
                loadDatabaseMetadata(scriptResult);

            diagram = loadFromDatabaseMetadata({
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
        databaseType,
        addDiagram,
        databaseEdition,
        closeCreateDiagramDialog,
        navigate,
        updateConfig,
        scriptResult,
        diagramNumber,
        errorMessage,
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
                className="flex max-h-[90vh] w-[90vw] flex-col overflow-y-auto md:overflow-visible xl:min-w-[45vw]"
                showClose={hasExistingDiagram}
            >
                {step === CreateDiagramDialogStep.SELECT_DATABASE ? (
                    <SelectDatabaseStep
                        createNewDiagram={createNewDiagram}
                        databaseType={databaseType}
                        hasExistingDiagram={hasExistingDiagram}
                        setDatabaseType={setDatabaseType}
                        setStep={setStep}
                    />
                ) : (
                    <ImportDatabaseStep
                        createNewDiagram={createNewDiagram}
                        databaseEdition={databaseEdition}
                        databaseType={databaseType}
                        errorMessage={errorMessage}
                        scriptResult={scriptResult}
                        setDatabaseEdition={setDatabaseEdition}
                        setStep={setStep}
                        setScriptResult={setScriptResult}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
};
