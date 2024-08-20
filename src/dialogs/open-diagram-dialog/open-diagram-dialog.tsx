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
import { ToggleGroup } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
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

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>Open Diagram</DialogTitle>
                <DialogDescription>
                    Choose which diagram do you want to continue to work on.
                </DialogDescription>
            </DialogHeader>
        )
    }, []);

    const renderContent = useCallback(() => {
        return (
            <div className="flex flex-1 items-center justify-center">
                <ToggleGroup
                    value={databaseType}
                    onValueChange={(value: DatabaseType) => {
                        if (!value) {
                            setDatabaseType(DatabaseType.GENERIC);
                        } else {
                            setDatabaseType(value);
                        }
                    }}
                    type="single"
                    className="grid grid-cols-3 grid-flow-row gap-6 xl:grid-cols-5"
                >

                </ToggleGroup>
            </div>
        );
    }, [
        databaseType,
        scriptResult,
        setScriptResult,
        setDatabaseType,
    ]);

    const renderFooter = useCallback(() => {
                return (
                    <DialogFooter className="flex !right gap-2">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={closeOpenDiagramDialog}
                            >
                                Close
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="default"
                                disabled={databaseType === DatabaseType.GENERIC}
                            >
                                Open
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                );
    }, [databaseType, scriptResult, createNewDiagram]);

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
