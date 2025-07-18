import React from 'react';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';

export interface DBMLInstructionsProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
}

export const DBMLInstructions: React.FC<DBMLInstructionsProps> = () => {
    return (
        <div className="flex h-full flex-col gap-4 overflow-auto text-xs">
            <div className="flex flex-col gap-2">
                <p>
                    Paste your DBML (Database Markup Language) schema to import
                    your database structure.
                </p>
                <div className="flex flex-col gap-1">
                    <p className="font-semibold">Supported DBML features:</p>
                    <ul className="ml-4 list-disc">
                        <li>Tables with fields and data types</li>
                        <li>Primary keys and unique constraints</li>
                        <li>Foreign key relationships (Ref)</li>
                        <li>Indexes (simple and composite)</li>
                        <li>Field attributes (not null, default values)</li>
                        <li>Comments</li>
                    </ul>
                </div>
                <div className="flex flex-col gap-1">
                    <p className="font-semibold">Currently unsupported:</p>
                    <ul className="ml-4 list-disc">
                        <li>TableGroup (will be ignored)</li>
                        <li>Note blocks (will be ignored)</li>
                        <li>Enum definitions (converted to varchar)</li>
                        <li>Array types (converted to text)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
