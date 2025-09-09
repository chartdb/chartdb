import React from 'react';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';

export interface DBMLInstructionsProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
}

export const DBMLInstructions: React.FC<DBMLInstructionsProps> = () => {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <h3 className="text-sm font-semibold">DBML Format</h3>
                <p className="text-xs text-muted-foreground">
                    Paste your DBML (Database Markup Language) schema definition
                    here.
                </p>
            </div>
            <div className="space-y-2">
                <h4 className="text-xs font-medium">Example:</h4>
                <pre className="rounded-md bg-muted p-2 text-xs">
                    {`Table users {
  id int [pk]
  username varchar
  email varchar
}

Table posts {
  id int [pk]
  user_id int [ref: > users.id]
  title varchar
  content text
}`}
                </pre>
            </div>
        </div>
    );
};
