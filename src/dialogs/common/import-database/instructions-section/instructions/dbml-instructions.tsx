import React from 'react';
import type { DatabaseType } from '@/lib/domain/database-type';
import type { DatabaseEdition } from '@/lib/domain/database-edition';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { setupDBMLLanguage } from '@/components/code-snippet/languages/dbml-language';

export interface DBMLInstructionsProps {
    databaseType: DatabaseType;
    databaseEdition?: DatabaseEdition;
}

export const DBMLInstructions: React.FC<DBMLInstructionsProps> = () => {
    return (
        <>
            <div className="flex flex-col gap-1 text-sm text-primary">
                <div>
                    Paste your DBML (Database Markup Language) schema definition
                    here →
                </div>
            </div>

            <div className="flex h-64 flex-col gap-1 text-sm text-primary">
                <h4 className="text-xs font-medium">Example:</h4>
                <CodeSnippet
                    className="h-full"
                    allowCopy={false}
                    editorProps={{
                        beforeMount: setupDBMLLanguage,
                    }}
                    code={`Table users {
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
                    language={'dbml'}
                />
            </div>
        </>
    );
};
