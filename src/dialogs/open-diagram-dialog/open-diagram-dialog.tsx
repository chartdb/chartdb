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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { useDialog } from '@/hooks/use-dialog';
import { useStorage } from '@/hooks/use-storage';
import { databaseTypeToLabelMap } from '@/lib/databases';

import { Diagram } from '@/lib/domain/diagram';
import { DialogProps } from '@radix-ui/react-dialog';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface OpenDiagramDialogProps {
    dialog: DialogProps;
}

export const OpenDiagramDialog: React.FC<OpenDiagramDialogProps> = ({
    dialog,
}) => {
    const { closeOpenDiagramDialog } = useDialog();
    const navigate = useNavigate();
    const { listDiagrams } = useStorage();
    const [diagrams, setDiagrams] = useState<Diagram[]>([]);
    const [selectedDiagramId, setSelectedDiagramId] = useState<
        string | undefined
    >();

    useEffect(() => {
        setSelectedDiagramId(undefined);
    }, [dialog.open]);

    useEffect(() => {
        const fetchDiagrams = async () => {
            const diagrams = await listDiagrams();
            setDiagrams(
                diagrams.sort(
                    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
                )
            );
        };
        fetchDiagrams();
    }, [listDiagrams, setDiagrams, dialog.open]);

    const openDiagram = (diagramId: string) => {
        if (selectedDiagramId) {
            navigate(`/diagrams/${diagramId}`);
        }
    };
    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open) {
                    closeOpenDiagramDialog();
                }
            }}
        >
            <DialogContent
                className="flex flex-col min-w-[500px] xl:min-w-[75vw] max-h-[80vh] overflow-y-auto"
                showClose
            >
                <DialogHeader>
                    <DialogTitle>Open Diagram</DialogTitle>
                    <DialogDescription>
                        Select a diagram to open from the list below.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-1 items-center justify-center">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Created at</TableHead>
                                <TableHead>Last modified</TableHead>
                                <TableHead>Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {diagrams.map((diagram) => (
                                <TableRow
                                    key={diagram.id}
                                    data-state={`${selectedDiagramId === diagram.id ? 'selected' : ''}`}
                                    onClick={(e) => {
                                        switch (e.detail) {
                                            case 1:
                                                setSelectedDiagramId(
                                                    diagram.id
                                                );
                                                break;
                                            case 2:
                                                openDiagram(diagram.id);
                                                closeOpenDiagramDialog();
                                                break;
                                            default:
                                                setSelectedDiagramId(
                                                    diagram.id
                                                );
                                        }
                                    }}
                                >
                                    <TableCell>{diagram.name}</TableCell>
                                    <TableCell>
                                        {diagram.createdAt.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {diagram.updatedAt.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        {
                                            databaseTypeToLabelMap[
                                                diagram.databaseType
                                            ]
                                        }
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <DialogFooter className="flex !justify-between gap-2">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            Cancel
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button
                            type="submit"
                            disabled={!selectedDiagramId}
                            onClick={() => openDiagram(selectedDiagramId ?? '')}
                        >
                            Open
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
