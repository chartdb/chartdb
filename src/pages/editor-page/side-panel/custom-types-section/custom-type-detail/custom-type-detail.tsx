import React, { useState } from 'react';
import type { DBCustomTypeKind } from '@/lib/domain/db-custom-type';
import { useChartDB } from '@/hooks/use-chartdb';
import { Button } from '@/components/button/button';
import { Input } from '@/components/input/input';
import { Pencil, Save, X, Plus, Trash, AlertTriangle } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';

interface CustomTypeDetailProps {
    customTypeId: string;
    onClose: () => void;
}

export const CustomTypeDetail: React.FC<CustomTypeDetailProps> = ({
    customTypeId,
    onClose,
}) => {
    const { getCustomType, updateCustomType, removeCustomType } = useChartDB();
    const customType = getCustomType(customTypeId);

    const [isEditing, setIsEditing] = useState(false);
    const [typeName, setTypeName] = useState(customType?.type || '');
    const [typeKind, setTypeKind] = useState<DBCustomTypeKind>(
        customType?.kind || 'enum'
    );
    const [enumValues, setEnumValues] = useState<string[]>(
        customType?.values || []
    );
    const [newEnumValue, setNewEnumValue] = useState('');
    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('');
    const [fields, setFields] = useState(customType?.fields || []);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    if (!customType) {
        return null;
    }

    const handleSave = async () => {
        await updateCustomType(customTypeId, {
            type: typeName,
            kind: typeKind,
            values: typeKind === 'enum' ? enumValues : undefined,
            fields: typeKind === 'composite' ? fields : undefined,
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTypeName(customType.type);
        setTypeKind(customType.kind);
        setEnumValues(customType.values || []);
        setFields(customType.fields || []);
        setIsEditing(false);
    };

    const handleAddEnumValue = () => {
        if (newEnumValue.trim() && !enumValues.includes(newEnumValue.trim())) {
            setEnumValues([...enumValues, newEnumValue.trim()]);
            setNewEnumValue('');
        }
    };

    const handleRemoveEnumValue = (value: string) => {
        setEnumValues(enumValues.filter((v) => v !== value));
    };

    const handleAddField = () => {
        if (newFieldName.trim() && newFieldType.trim()) {
            setFields([
                ...fields,
                { field: newFieldName.trim(), type: newFieldType.trim() },
            ]);
            setNewFieldName('');
            setNewFieldType('');
        }
    };

    const handleRemoveField = (index: number) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const handleDelete = async () => {
        await removeCustomType(customTypeId);
        setIsDeleteDialogOpen(false);
        onClose();
    };

    return (
        <>
            <div className="flex flex-col space-y-4 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                        {isEditing ? (
                            <Input
                                value={typeName}
                                onChange={(e) => setTypeName(e.target.value)}
                                className="w-full"
                            />
                        ) : (
                            customType.type
                        )}
                    </h3>
                    <div className="flex items-center space-x-2">
                        {isEditing ? (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancel}
                                >
                                    <X className="mr-1 size-4" />
                                    Cancel
                                </Button>
                                <Button size="sm" onClick={handleSave}>
                                    <Save className="mr-1 size-4" />
                                    Save
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditing(true)}
                                >
                                    <Pencil className="mr-1 size-4" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={onClose}
                                >
                                    <X className="size-4" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                <div className="text-sm text-muted-foreground">
                    <span className="font-semibold">Schema:</span>{' '}
                    {customType.schema}
                </div>

                <div className="text-sm text-muted-foreground">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Kind:</span>
                            <Select
                                value={typeKind}
                                onValueChange={(value) =>
                                    setTypeKind(value as DBCustomTypeKind)
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="enum">enum</SelectItem>
                                    <SelectItem value="composite">
                                        composite
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <>
                            <span className="font-semibold">Kind:</span>{' '}
                            {customType.kind}
                        </>
                    )}
                </div>

                {(typeKind === 'enum' ||
                    (!isEditing && customType.kind === 'enum')) && (
                    <div className="rounded-md border p-3">
                        <h4 className="mb-2 font-medium">Values</h4>
                        {isEditing && (
                            <div className="mb-2 flex items-center">
                                <Input
                                    value={newEnumValue}
                                    onChange={(e) =>
                                        setNewEnumValue(e.target.value)
                                    }
                                    placeholder="Add new value"
                                    className="mr-2 flex-1"
                                />
                                <Button size="sm" onClick={handleAddEnumValue}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {(isEditing
                                ? enumValues
                                : customType.values || []
                            ).map((value, index) => (
                                <div
                                    key={index}
                                    className="flex items-center rounded-md bg-muted px-2 py-1 text-muted-foreground"
                                >
                                    {value}
                                    {isEditing && (
                                        <button
                                            className="ml-1 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                handleRemoveEnumValue(value)
                                            }
                                        >
                                            <X className="size-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(typeKind === 'composite' ||
                    (!isEditing && customType.kind === 'composite')) && (
                    <div className="rounded-md border p-3">
                        <h4 className="mb-2 font-medium">Fields</h4>
                        {isEditing && (
                            <div className="mb-2 flex items-center gap-2">
                                <Input
                                    value={newFieldName}
                                    onChange={(e) =>
                                        setNewFieldName(e.target.value)
                                    }
                                    placeholder="Field name"
                                    className="flex-1"
                                />
                                <Input
                                    value={newFieldType}
                                    onChange={(e) =>
                                        setNewFieldType(e.target.value)
                                    }
                                    placeholder="Field type"
                                    className="flex-1"
                                />
                                <Button size="sm" onClick={handleAddField}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        )}
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-xs text-muted-foreground">
                                    <th className="pb-2 text-left">Field</th>
                                    <th className="pb-2 text-left">Type</th>
                                    {isEditing && <th className="w-10"></th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(isEditing
                                    ? fields
                                    : customType.fields || []
                                ).map((field, index) => (
                                    <tr
                                        key={index}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-2">{field.field}</td>
                                        <td className="py-2">{field.type}</td>
                                        {isEditing && (
                                            <td className="py-2">
                                                <button
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        handleRemoveField(index)
                                                    }
                                                >
                                                    <X className="size-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {isEditing && (
                    <Button
                        variant="destructive"
                        size="sm"
                        className="mt-4"
                        onClick={() => setIsDeleteDialogOpen(true)}
                    >
                        <Trash className="mr-1 size-4" />
                        Delete Custom Type
                    </Button>
                )}
            </div>

            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="size-5 text-destructive" />
                            Confirm Deletion
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        Are you sure you want to delete the custom type "
                        {customType.type}"? This action cannot be undone.
                    </DialogDescription>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
