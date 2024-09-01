import React, { useCallback } from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { databaseSecondaryLogoMap } from '@/lib/databases';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { Textarea } from '@/components/textarea/textarea';
import { importMetadataScripts } from '@/lib/data/import-metadata/scripts/scripts';
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
import { CreateDiagramDialogStep } from './create-diagram-dialog-step';

export interface CreateDiagramDialogImportDatabaseProps {
    setStep: React.Dispatch<React.SetStateAction<CreateDiagramDialogStep>>;
    createNewDiagram: () => void;
    scriptResult: string;
    setScriptResult: React.Dispatch<React.SetStateAction<string>>;
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
    setDatabaseEdition: React.Dispatch<
        React.SetStateAction<DatabaseEdition | undefined>
    >;
    errorMessage: string;
}

export const CreateDiagramDialogImportDatabase: React.FC<
    CreateDiagramDialogImportDatabaseProps
> = ({
    setScriptResult,
    setStep,
    scriptResult,
    createNewDiagram,
    databaseType,
    databaseEdition,
    setDatabaseEdition,
    errorMessage,
}) => {
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const inputValue = e.target.value;
            setScriptResult(inputValue);
        },
        [setScriptResult]
    );

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>Import your Database</DialogTitle>
            </DialogHeader>
        );
    }, []);

    const renderContent = useCallback(() => {
        return (
            <div className="flex w-full flex-1 flex-col gap-6">
                {databaseTypeToEditionMap[databaseType].length > 0 ? (
                    <div className="flex flex-col gap-1 md:flex-row">
                        <p className="text-sm leading-6 text-muted-foreground">
                            Database edition:
                        </p>
                        <ToggleGroup
                            type="single"
                            className="ml-1 gap-2"
                            value={
                                !databaseEdition ? 'regular' : databaseEdition
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
                                className="h-6 gap-1 p-0 px-2 shadow-none"
                            >
                                <Avatar className="size-4">
                                    <AvatarImage
                                        src={
                                            databaseSecondaryLogoMap[
                                                databaseType
                                            ]
                                        }
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
                                        className="h-6 gap-1 p-0 px-2 shadow-none"
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
                                                {
                                                    databaseEditionToLabelMap[
                                                        edition
                                                    ]
                                                }
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
                <div className="flex h-48 flex-col gap-1">
                    <p className="text-sm text-muted-foreground">
                        2. Paste the script result here:
                    </p>
                    <Textarea
                        className="w-full flex-1 rounded-md bg-muted p-2 text-sm"
                        placeholder="Script result here..."
                        value={scriptResult}
                        onChange={handleInputChange}
                    />
                    {errorMessage && (
                        <p className="mt-2 text-sm text-red-700">
                            {errorMessage}
                        </p>
                    )}
                </div>
            </div>
        );
    }, [
        databaseEdition,
        databaseType,
        errorMessage,
        handleInputChange,
        scriptResult,
        setDatabaseEdition,
    ]);

    const renderFooter = useCallback(() => {
        return (
            <DialogFooter className="mt-4 flex !justify-between gap-2">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                            setStep(CreateDiagramDialogStep.SELECT_DATABASE)
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
    }, [createNewDiagram, errorMessage.length, scriptResult, setStep]);

    return (
        <>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </>
    );
};
