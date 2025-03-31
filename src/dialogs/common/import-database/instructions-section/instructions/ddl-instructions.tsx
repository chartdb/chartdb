import React from 'react';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { DDLInstructionStep } from './ddl-instruction-step';

export interface DDLInstructionsProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
}

export const DDLInstructions: React.FC<DDLInstructionsProps> = () => {
    return (
        <>
            <DDLInstructionStep index={1} text={'Install pg_dump.'} />
            <DDLInstructionStep
                index={2}
                text={
                    'Execute the following command in your terminal (prefix with sudo on Linux if needed):'
                }
                code={`pg_dump -h <host> -p <port> -d <database_name> \n  -U <username> -s -F p -E UTF-8 \n  -f <output_file_path>`}
                example={`pg_dump -h localhost -p 5432 -d my_db \n  -U postgres -s -F p -E UTF-8 \n  -f schema_export.sql`}
            />
            <DDLInstructionStep
                index={3}
                text={
                    'Open the exported SQL file, copy its contents, and paste them here.'
                }
            />
        </>
    );
};
