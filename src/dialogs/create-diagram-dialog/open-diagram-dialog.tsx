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
import { useOpenDiagramDialog } from '@/hooks/use-open-diagram-dialog';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import {
    DatabaseMetadata,
    loadDatabaseMetadata,
} from '@/lib/data/import-metadata/metadata-types/database-metadata';
import { generateId } from '@/lib/utils';

enum OpenDiagramDialogStep {
    SELECT_DATABASE = 'SELECT_DATABASE',
    IMPORT_DATABASE = 'IMPORT_DATABASE',
}

export interface OpenDiagramDialogProps {
    dialog: DialogProps;
}

export const OpenDiagramDialog: React.FC<OpenDiagramDialogProps> = ({
    dialog,
}) => {
    const [databaseType, setDatabaseType] = React.useState<DatabaseType>(
        DatabaseType.GENERIC
    );
    const { closeOpenDiagramDialog } = useOpenDiagramDialog();
    const { updateConfig } = useConfig();
    const [scriptResult, setScriptResult] = React.useState('');
    const [step, setStep] = React.useState<OpenDiagramDialogStep>(
        OpenDiagramDialogStep.SELECT_DATABASE
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
    }, [listDiagrams, setDiagramNumber]);

    const createNewDiagram = useCallback(async () => {
        let diagram: Diagram = {
            id: generateId(),
            name: `Diagram ${diagramNumber}`,
            databaseType: databaseType ?? DatabaseType.GENERIC,
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
        closeOpenDiagramDialog();
        navigate(`/diagrams/${diagram.id}`);
    }, [
        databaseType,
        addDiagram,
        closeOpenDiagramDialog,
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
            case OpenDiagramDialogStep.SELECT_DATABASE:
                return (
                    <DialogHeader>
                        <DialogTitle>What is your Database?</DialogTitle>
                        <DialogDescription>
                            Each database has its own unique features and
                            capabilities.
                        </DialogDescription>
                    </DialogHeader>
                );
            case OpenDiagramDialogStep.IMPORT_DATABASE:
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
            case OpenDiagramDialogStep.SELECT_DATABASE:
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
                                        OpenDiagramDialogStep.IMPORT_DATABASE
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
            case OpenDiagramDialogStep.IMPORT_DATABASE:
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
            case OpenDiagramDialogStep.SELECT_DATABASE:
                return (
                    <DialogFooter className="flex !justify-between gap-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={createNewDiagram}
                            >
                                Skip
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="default"
                                disabled={databaseType === DatabaseType.GENERIC}
                            >
                                Continue
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                );
            case OpenDiagramDialogStep.IMPORT_DATABASE:
                return (
                    <DialogFooter className="flex !justify-between gap-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    setStep(
                                        OpenDiagramDialogStep.SELECT_DATABASE
                                    )
                                }
                            >
                                Back
                            </Button>
                        </DialogClose>
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
    }, [step, databaseType, scriptResult, createNewDiagram]);

    return (
        <Dialog {...dialog}>
            <DialogContent
                className="flex flex-col min-w-[500px] xl:min-w-[75vw] max-h-[80vh] overflow-y-auto"
                showClose={false}
            >
                {renderHeader()}
                {renderContent()}
                {renderFooter()}
            </DialogContent>
        </Dialog>
    );
};
