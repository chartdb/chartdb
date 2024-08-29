import React, { useCallback, useEffect, useState } from 'react';
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
import { databaseLogoMap, databaseSecondaryLogoMap } from '@/lib/databases';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { Textarea } from '@/components/textarea/textarea';
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
import { importMetadataScripts } from '@/lib/data/import-metadata/scripts/scripts';
import { Link } from '@/components/link/link';
import { LayoutGrid } from 'lucide-react';
import {
    DatabaseEdition,
    databaseEditionToImageMap,
    databaseEditionToLabelMap,
    databaseTypeToEditionMap,
} from '@/lib/domain/database-edition';
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@/components/avatar/avatar';

enum CreateDiagramDialogStep {
    SELECT_DATABASE = 'SELECT_DATABASE',
    IMPORT_DATABASE = 'IMPORT_DATABASE',
}

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

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const inputValue = e.target.value;
        setScriptResult(inputValue);
    };

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

    const renderDatabaseOption = useCallback((type: DatabaseType) => {
        const logo = databaseLogoMap[type];
        return (
            <ToggleGroupItem
                value={type}
                aria-label="Toggle bold"
                className="flex w-22 h-22 md:w-32 md:h-32"
            >
                <img src={logo} alt="PostgreSQL" />
            </ToggleGroupItem>
        );
    }, []);

    const renderExamplesOption = useCallback(
        () => (
            <div
                className="flex w-22 h-22 md:w-32 md:h-32 rounded-md items-center text-center flex-col py-3 border cursor-pointer"
                onClick={() => window.open('/examples')}
            >
                <div className="flex items-center flex-1">
                    <Link href="/examples" className="text-sm text-primary">
                        <LayoutGrid size={34} />
                    </Link>
                </div>
                <div className="flex flex-col-reverse">
                    <Link href="/examples" className="text-sm text-primary">
                        Check Examples
                    </Link>
                </div>
            </div>
        ),
        []
    );

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
                            className="grid grid-cols-3 grid-flow-row gap-6"
                        >
                            {renderDatabaseOption(DatabaseType.MYSQL)}
                            {renderDatabaseOption(DatabaseType.POSTGRESQL)}
                            {renderDatabaseOption(DatabaseType.MARIADB)}
                            {renderDatabaseOption(DatabaseType.SQLITE)}
                            {renderDatabaseOption(DatabaseType.SQL_SERVER)}
                            {renderExamplesOption()}
                        </ToggleGroup>
                    </div>
                );
            case CreateDiagramDialogStep.IMPORT_DATABASE:
                return (
                    <div className="flex flex-1 flex-col w-full gap-6">
                        {databaseTypeToEditionMap[databaseType].length > 0 ? (
                            <div className="flex flex-col md:flex-row gap-1">
                                <p className="text-sm text-muted-foreground leading-6">
                                    Database edition:
                                </p>
                                <ToggleGroup
                                    type="single"
                                    className="gap-2 ml-1"
                                    value={
                                        !databaseEdition
                                            ? 'regular'
                                            : databaseEdition
                                    }
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
                                        className="gap-1 h-6 p-0 px-2 shadow-none"
                                    >
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage
                                                src={
                                                    databaseSecondaryLogoMap[
                                                        databaseType
                                                    ]
                                                }
                                                alt="Regular"
                                            />
                                            <AvatarFallback>
                                                Regular
                                            </AvatarFallback>
                                        </Avatar>
                                        Regular
                                    </ToggleGroupItem>
                                    {databaseTypeToEditionMap[databaseType].map(
                                        (edition) => (
                                            <ToggleGroupItem
                                                value={edition}
                                                key={edition}
                                                variant="outline"
                                                className="gap-1 h-6 p-0 px-2 shadow-none"
                                            >
                                                <Avatar className="h-4 w-4">
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
                                                        {
                                                            databaseEditionToLabelMap[
                                                                edition
                                                            ]
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                {
                                                    databaseEditionToLabelMap[
                                                        edition
                                                    ]
                                                }
                                            </ToggleGroupItem>
                                        )
                                    )}
                                </ToggleGroup>
                            </div>
                        ) : null}
                        <div className="flex flex-col gap-1">
                            <p className="text-sm text-muted-foreground">
                                1. Run this script in your database:
                            </p>
                            <CodeSnippet
                                className="max-h-40 w-full"
                                code={importMetadataScripts[databaseType]({
                                    databaseEdition,
                                })}
                            />
                        </div>
                        <div className="flex flex-col gap-1 h-48">
                            <p className="text-sm text-muted-foreground">
                                2. Paste the script result here:
                            </p>
                            <Textarea
                                className="flex-1 w-full p-2 text-sm bg-muted-1 rounded-md"
                                placeholder="Script result here..."
                                value={scriptResult}
                                onChange={handleInputChange}
                            />
                            {errorMessage && (
                                <p className="text-red-700 text-sm mt-2">
                                    {errorMessage}
                                </p>
                            )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }, [
        errorMessage,
        databaseEdition,
        step,
        databaseType,
        scriptResult,
        renderDatabaseOption,
        setDatabaseType,
        renderExamplesOption,
    ]);

    const renderFooter = useCallback(() => {
        switch (step) {
            case CreateDiagramDialogStep.SELECT_DATABASE:
                return (
                    <DialogFooter className="flex !justify-between gap-2 mt-4">
                        {hasExistingDiagram ? (
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Cancel
                                </Button>
                            </DialogClose>
                        ) : (
                            <div></div>
                        )}
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={createNewDiagram}
                            >
                                Empty diagram
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
                    </DialogFooter>
                );
            case CreateDiagramDialogStep.IMPORT_DATABASE:
                return (
                    <DialogFooter className="flex !justify-between gap-2 mt-4">
                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() =>
                                    setStep(
                                        CreateDiagramDialogStep.SELECT_DATABASE
                                    )
                                }
                            >
                                Back
                            </Button>
                        </div>
                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={createNewDiagram}
                                >
                                    Empty diagram
                                </Button>
                            </DialogClose>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="default"
                                    disabled={
                                        scriptResult.trim().length === 0 ||
                                        errorMessage.length > 0
                                    }
                                    onClick={createNewDiagram}
                                >
                                    Import
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
                className="flex flex-col w-[100vw] xl:min-w-[45vw] overflow-y-auto"
                showClose={hasExistingDiagram}
            >
                {renderHeader()}
                {renderContent()}
                {renderFooter()}
            </DialogContent>
        </Dialog>
    );
};
