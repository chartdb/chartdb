import React, { useState } from 'react';
import type { DBCustomType } from '@/lib/domain/db-custom-type';
import { Database } from 'lucide-react';
import { CustomTypeDetail } from '../custom-type-detail/custom-type-detail';

export interface CustomTypeListProps {
    customTypes: DBCustomType[];
}

export const CustomTypeList: React.FC<CustomTypeListProps> = ({
    customTypes,
}) => {
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);

    const handleSelectType = (typeId: string) => {
        setSelectedTypeId(typeId === selectedTypeId ? null : typeId);
    };

    const handleCloseDetail = () => {
        setSelectedTypeId(null);
    };

    return (
        <div className="space-y-2 p-1">
            {customTypes.map((type) => (
                <React.Fragment key={type.id}>
                    <div
                        onClick={() => handleSelectType(type.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-md border p-2 hover:bg-muted ${
                            selectedTypeId === type.id ? 'border-primary' : ''
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <Database className="size-4 text-muted-foreground" />
                            <span className="font-medium">{type.type}</span>
                            <span className="text-xs text-muted-foreground">
                                ({type.schema})
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                                {type.kind}
                            </span>
                            {type.kind === 'enum' && (
                                <span className="text-xs text-muted-foreground">
                                    {type.values?.length} values
                                </span>
                            )}
                            {type.kind === 'composite' && (
                                <span className="text-xs text-muted-foreground">
                                    {type.fields?.length} fields
                                </span>
                            )}
                        </div>
                    </div>
                    {selectedTypeId === type.id && (
                        <div className="mb-2 mt-1 rounded-md border bg-card">
                            <CustomTypeDetail
                                customTypeId={type.id}
                                onClose={handleCloseDetail}
                            />
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};
