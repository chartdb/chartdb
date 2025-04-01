import React from 'react';
import { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { DDLInstructionStep } from './ddl-instruction-step';

interface DDLInstruction {
    text: string;
    code?: string;
    example?: string;
}

const DDLInstructionsMap: Record<DatabaseType, DDLInstruction[]> = {
    [DatabaseType.GENERIC]: [],
    [DatabaseType.MYSQL]: [
        {
            text: 'Install mysqldump.',
        },
        {
            text: 'Execute the following command in your terminal (prefix with sudo on Linux if needed):',
            code: `mysqldump -h <host> -u <username>\n-P <port> -p --no-data\n<database_name> > <output_path>`,
            example: `mysqldump -h localhost -u root -P\n3306 -p --no-data my_db >\nschema_export.sql`,
        },
        {
            text: 'Open the exported SQL file, copy its contents, and paste them here.',
        },
    ],
    [DatabaseType.POSTGRESQL]: [
        {
            text: 'Install pg_dump.',
        },
        {
            text: 'Execute the following command in your terminal (prefix with sudo on Linux if needed):',
            code: `pg_dump -h <host> -p <port> -d <database_name> \n  -U <username> -s -F p -E UTF-8 \n  -f <output_file_path>`,
            example: `pg_dump -h localhost -p 5432 -d my_db \n  -U postgres -s -F p -E UTF-8 \n  -f schema_export.sql`,
        },
        {
            text: 'Open the exported SQL file, copy its contents, and paste them here.',
        },
    ],
    [DatabaseType.SQLITE]: [
        {
            text: 'Install sqlite3.',
        },
        {
            text: 'Execute the following command in your terminal:',
            code: `sqlite3 <database_file_path>\n.dump > <output_file_path>`,
            example: `sqlite3 my_db.db\n.dump > schema_export.sql`,
        },
        {
            text: 'Open the exported SQL file, copy its contents, and paste them here.',
        },
    ],
    [DatabaseType.SQL_SERVER]: [
        {
            text: 'Download and install SQL Server Management Studio (SSMS).',
        },
        {
            text: 'Connect to your SQL Server instance using SSMS.',
        },
        {
            text: 'Right-click on the database you want to export and select Script Database as > CREATE To > New Query Editor Window.',
        },
        {
            text: 'Copy the generated script and paste it here.',
        },
    ],
    [DatabaseType.CLICKHOUSE]: [],
    [DatabaseType.COCKROACHDB]: [
        {
            text: 'Install pg_dump.',
        },
        {
            text: 'Execute the following command in your terminal (prefix with sudo on Linux if needed):',
            code: `pg_dump -h <host> -p <port> -d <database_name> \n  -U <username> -s -F p -E UTF-8 \n  -f <output_file_path>`,
            example: `pg_dump -h localhost -p 5432 -d my_db \n  -U postgres -s -F p -E UTF-8 \n  -f schema_export.sql`,
        },
        {
            text: 'Open the exported SQL file, copy its contents, and paste them here.',
        },
    ],
    [DatabaseType.MARIADB]: [
        {
            text: 'Install mysqldump.',
        },
        {
            text: 'Execute the following command in your terminal (prefix with sudo on Linux if needed):',
            code: `mysqldump -h <host> -u <username>\n-P <port> -p --no-data\n<database_name> > <output_path>`,
            example: `mysqldump -h localhost -u root -P\n3306 -p --no-data my_db >\nschema_export.sql`,
        },
        {
            text: 'Open the exported SQL file, copy its contents, and paste them here.',
        },
    ],
};

export interface DDLInstructionsProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
}

export const DDLInstructions: React.FC<DDLInstructionsProps> = ({
    databaseType,
}) => {
    return (
        <>
            {DDLInstructionsMap[databaseType].map((instruction, index) => (
                <DDLInstructionStep
                    key={index}
                    index={index + 1}
                    text={instruction.text}
                    code={instruction.code}
                    example={instruction.example}
                />
            ))}
        </>
    );
};
