import { cn } from '@/lib/utils';
import React from 'react';
import { CopyBlock, atomOneDark } from 'react-code-blocks';
import { CodeBlockProps } from 'react-code-blocks/dist/components/CodeBlock';

export interface CodeSnippetProps {
    className?: string;
    codeProps?: CodeBlockProps;
}

export const CodeSnippet: React.FC<CodeSnippetProps> = ({
    className,
    codeProps,
}) => {
    return (
        <div className={cn('flex flex-1', className)}>
            <CopyBlock
                language="sql"
                text={
                    "WITH fk_info as ( \n\
	(SELECT (@fk_info:=NULL),\n\
              (SELECT (0)\n\
               FROM (SELECT kcu.table_schema,\n\
						    kcu.table_name,\n\
						    kcu.column_name as fk_column,\n\
						    kcu.constraint_name as foreign_key_name,\n\
						    kcu.referenced_table_name as reference_table,\n\
						    kcu.referenced_column_name as reference_column,\n\
						    CONCAT('FOREIGN KEY (', kcu.column_name, ') REFERENCES ', \n\
						           kcu.referenced_table_name, '(', kcu.refssssssssssssssssssssssssssssssssserenced_column_name, ') ',\n\
						           'ON UPDATE ', rc.update_rule, \n\
						           ' ON DELETE ', rc.delete_rule) AS fk_def\n\
						FROM\n\
						    information_schema.key_column_usage kcu\n\
						JOIN\n\
						    information_schema.referential_constraints rc\n\
						    ON kcu.constraint_name = rc.constraint_name\n\
						    AND kcu.table_name = rc.table_name\n\
						WHERE\n\
						    kcu.referenced_table_name IS NOT NULL) as fk\n\
             	WHERE table_schema LIKE IFNULL(NULL, '%')\n\
                   AND table_schema = DATABASE()"
                }
                theme={atomOneDark}
                customStyle={{
                    display: 'flex',
                    flex: '1',
                    fontSize: '14px',
                    width: '100%',
                }}
                {...codeProps}
            />
        </div>
    );
};
