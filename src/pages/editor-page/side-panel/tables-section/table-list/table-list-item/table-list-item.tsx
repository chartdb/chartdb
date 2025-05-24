import React, { useEffect, useCallback } from 'react';
import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/accordion/accordion';
import { TableListItemHeader } from './table-list-item-header/table-list-item-header';
import { TableListItemContent } from './table-list-item-content/table-list-item-content';
import type { DBTable } from '@/lib/domain/db-table';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface TableListItemProps {
    table: DBTable;
    searchText?: string;
    searchOptions?: {
        searchInFields: boolean;
        searchInTypes: boolean;
        searchInComments: boolean;
        caseSensitive: boolean;
    };
    onMatchFound?: (tableId: string, hasMatch: boolean) => void;
}

export const TableListItem: React.FC<TableListItemProps> = ({
    table,
    searchText,
    searchOptions,
    onMatchFound,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id: table.id });

    const [isExpanded, setIsExpanded] = React.useState(false);

    // Handle manual expand/collapse
    const handleToggle = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded((prev) => !prev);
    }, []);

    useEffect(() => {
        if (!searchText?.trim()) {
            onMatchFound?.(table.id, false);
            setIsExpanded(false);
            return;
        }

        const searchValue = searchOptions?.caseSensitive
            ? searchText
            : searchText.toLowerCase();

        const tableName = searchOptions?.caseSensitive
            ? table.name
            : table.name.toLowerCase();

        const matches = [];
        let hasFieldMatch = false;

        // Check table name
        const hasTableNameMatch = tableName.includes(searchValue);
        matches.push(hasTableNameMatch);

        // Check fields
        if (searchOptions?.searchInFields) {
            const fieldMatch = table.fields.some((field) =>
                (searchOptions.caseSensitive
                    ? field.name
                    : field.name.toLowerCase()
                ).includes(searchValue)
            );
            matches.push(fieldMatch);
            hasFieldMatch = hasFieldMatch || fieldMatch;
        }

        // Check field types
        if (searchOptions?.searchInTypes) {
            const typeMatch = table.fields.some((field) =>
                (searchOptions.caseSensitive
                    ? field.type.name
                    : field.type.name.toLowerCase()
                ).includes(searchValue)
            );
            matches.push(typeMatch);
            hasFieldMatch = hasFieldMatch || typeMatch;
        }

        // Check comments
        if (searchOptions?.searchInComments) {
            const commentMatch = table.fields.some(
                (field) =>
                    field.comments &&
                    (searchOptions.caseSensitive
                        ? field.comments
                        : field.comments.toLowerCase()
                    ).includes(searchValue)
            );
            matches.push(commentMatch);
            hasFieldMatch = hasFieldMatch || commentMatch;
        }

        const hasMatch = matches.some((match) => match);
        onMatchFound?.(table.id, hasMatch);

        // Only expand when there are field matches, collapse otherwise
        if (hasFieldMatch) {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    }, [searchText, searchOptions, table, onMatchFound]);

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <AccordionItem
            value={table.id}
            className="border-none"
            ref={setNodeRef}
            style={style}
            {...attributes}
        >
            <AccordionTrigger
                className="flex w-full items-center justify-between px-2 py-1 text-sm hover:bg-secondary"
                style={{
                    backgroundColor: table.color
                        ? `${table.color}99`
                        : undefined,
                }}
                onClick={handleToggle}
                data-state={isExpanded ? 'open' : 'closed'}
            >
                <TableListItemHeader
                    table={table}
                    searchText={searchText}
                    searchOptions={searchOptions}
                    {...listeners}
                />
            </AccordionTrigger>
            {isExpanded && (
                <AccordionContent>
                    <TableListItemContent
                        table={table}
                        searchText={searchText}
                        searchOptions={searchOptions}
                    />
                </AccordionContent>
            )}
        </AccordionItem>
    );
};
