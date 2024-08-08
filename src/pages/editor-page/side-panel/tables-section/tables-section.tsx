import React from 'react';
import { TableList } from './table-list/table-list';

export interface TablesSectionProps {}

export const TablesSection: React.FC<TablesSectionProps> = () => {
    return (
        <section className="flex h-full flex-col px-2">
            <TableList />
        </section>
    );
};
