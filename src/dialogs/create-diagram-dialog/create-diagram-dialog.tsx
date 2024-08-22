import React, { useCallback, useEffect } from 'react';
import { Button } from '@/components/button/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { DialogProps } from '@radix-ui/react-dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { getDatabaseLogo } from '@/lib/databases';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { Textarea } from '@/components/textarea/textarea';
import { useStorage } from '@/hooks/use-storage';
import { Diagram, loadFromDatabaseMetadata } from '@/lib/domain/diagram';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import {
    DatabaseMetadata,
    loadDatabaseMetadata,
} from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { generateId } from '@/lib/utils';
import { useChartDB } from '@/hooks/use-chartdb';
import { useDialog } from '@/hooks/use-dialog';

enum CreateDiagramDialogStep {
    SELECT_DATABASE = 'SELECT_DATABASE',
    IMPORT_DATABASE = 'IMPORT_DATABASE',
}

export interface CreateDiagramDialogProps {
    dialog: DialogProps;
}

export const CreateDiagramDialog: React.FC<CreateDiagramDialogProps> = ({
    dialog,
}) => {
    const { diagramId } = useChartDB();
    const [databaseType, setDatabaseType] = React.useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const { closeCreateDiagramDialog } = useDialog();
    const { updateConfig } = useConfig();
    const [scriptResult, setScriptResult] = React.useState('');
    const [step, setStep] = React.useState<CreateDiagramDialogStep>(
        CreateDiagramDialogStep.SELECT_DATABASE
    );
    const { listDiagrams, addDiagram } = useStorage();
    const [diagramNumber, setDiagramNumber] = React.useState<number>(1);
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
        setScriptResult('');
    }, [dialog.open]);

    const hasExistingDiagram = (diagramId ?? '').trim().length !== 0;

    const createNewDiagram = useCallback(async () => {
        let diagram: Diagram = {
            id: generateId(),
            name: `Diagram ${diagramNumber}`,
            databaseType: databaseType ?? DatabaseType.GENERIC,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        if (scriptResult.trim().length !== 0) {
            const databaseMetadata: DatabaseMetadata =
                loadDatabaseMetadata(scriptResult);

            diagram = loadFromDatabaseMetadata({
                databaseType,
                databaseMetadata,
                diagramNumber,
            });
        }

        await addDiagram({ diagram });
        await updateConfig({ defaultDiagramId: diagram.id });
        closeCreateDiagramDialog();
        navigate(`/diagrams/${diagram.id}`);
    }, [
        databaseType,
        addDiagram,
        closeCreateDiagramDialog,
        navigate,
        updateConfig,
        scriptResult,
        diagramNumber,
    ]);

    const renderDatabaseOption = useCallback((type: DatabaseType) => {
        const logo = getDatabaseLogo(type);
        return (
            <ToggleGroupItem
                value={type}
                aria-label="Toggle bold"
                className="flex w-32 h-32"
            >
                <img src={logo} alt="PostgreSQL" />
            </ToggleGroupItem>
        );
    }, []);

    const renderHeader = useCallback(() => {
        switch (step) {
            case CreateDiagramDialogStep.SELECT_DATABASE:
                return (
                    <DialogHeader>
                        <DialogTitle>What is your Database?</DialogTitle>
                        <DialogDescription>
                            Each database has its own unique features and
                            capabilities.
                        </DialogDescription>
                    </DialogHeader>
                );
            case CreateDiagramDialogStep.IMPORT_DATABASE:
                return (
                    <DialogHeader>
                        <DialogTitle>Import your Database</DialogTitle>
                    </DialogHeader>
                );
            default:
                return null;
        }
    }, [step]);

    const renderContent = useCallback(() => {
        switch (step) {
            case CreateDiagramDialogStep.SELECT_DATABASE:
                return (
                    <div className="flex flex-1 items-center justify-center">
                        <ToggleGroup
                            value={databaseType}
                            onValueChange={(value: DatabaseType) => {
                                if (!value) {
                                    setDatabaseType(DatabaseType.GENERIC);
                                } else {
                                    setDatabaseType(value);
                                    setStep(
                                        CreateDiagramDialogStep.IMPORT_DATABASE
                                    );
                                }
                            }}
                            type="single"
                            className="grid grid-cols-3 grid-flow-row gap-6 xl:grid-cols-5"
                        >
                            {renderDatabaseOption(DatabaseType.MYSQL)}
                            {renderDatabaseOption(DatabaseType.POSTGRESQL)}
                            {renderDatabaseOption(DatabaseType.MARIADB)}
                            {renderDatabaseOption(DatabaseType.SQLITE)}
                            {renderDatabaseOption(DatabaseType.SQL_SERVER)}
                        </ToggleGroup>
                    </div>
                );
            case CreateDiagramDialogStep.IMPORT_DATABASE:
                return (
                    <div className="flex flex-1 flex-col w-full gap-6">
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground">
                                1. Run this script in your database:
                            </p>
                            <CodeSnippet className="max-h-40 w-full" />
                        </div>
                        <div className="flex flex-col gap-1 h-48">
                            <p className="text-sm text-muted-foreground">
                                2. Paste the script result here:
                            </p>
                            <Textarea
                                className="flex-1 w-full p-2 text-sm bg-muted-1 rounded-md"
                                placeholder="Script result here..."
                                value={scriptResult}
                                onChange={(e) =>
                                    setScriptResult(e.target.value)
                                }
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }, [
        step,
        databaseType,
        scriptResult,
        setScriptResult,
        renderDatabaseOption,
        setDatabaseType,
    ]);

    const renderFooter = useCallback(() => {
        switch (step) {
            case CreateDiagramDialogStep.SELECT_DATABASE:
                return (
                    <DialogFooter className="flex !justify-between gap-2">
                        {hasExistingDiagram ? (
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    // onClick={createNewDiagram}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                        ) : (
                            <div></div>
                        )}
                        {/* <DialogClose asChild> */}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={createNewDiagram}
                            >
                                Skip
                            </Button>
                            <Button
                                type="button"
                                variant="default"
                                disabled={databaseType === DatabaseType.GENERIC}
                                onClick={() =>
                                    setStep(
                                        CreateDiagramDialogStep.IMPORT_DATABASE
                                    )
                                }
                            >
                                Continue
                            </Button>
                        </div>
                        {/* </DialogClose> */}
                    </DialogFooter>
                );
            case CreateDiagramDialogStep.IMPORT_DATABASE:
                return (
                    <DialogFooter className="flex !justify-between gap-2">
                        {/* <DialogClose asChild> */}
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() =>
                                setStep(CreateDiagramDialogStep.SELECT_DATABASE)
                            }
                        >
                            Back
                        </Button>
                        {/* </DialogClose> */}
                        <div className="flex gap-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={createNewDiagram}
                                >
                                    Skip this step
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="default"
                                    disabled={scriptResult.trim().length === 0}
                                    onClick={createNewDiagram}
                                >
                                    Finish
                                </Button>
                            </DialogClose>
                        </div>
                    </DialogFooter>
                );
            default:
                return null;
        }
    }, [
        step,
        databaseType,
        scriptResult,
        createNewDiagram,
        hasExistingDiagram,
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
                className="flex flex-col min-w-[500px] xl:min-w-[75vw] max-h-[80vh] overflow-y-auto"
                showClose={hasExistingDiagram}
            >
                {renderHeader()}
                {renderContent()}
                {renderFooter()}
            </DialogContent>
        </Dialog>
    );
};
