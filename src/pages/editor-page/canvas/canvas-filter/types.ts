export type NodeType = 'schema' | 'area' | 'table';
export type GroupingMode = 'schema' | 'area';

export type SchemaContext = { name: string; visible: boolean };
export type AreaContext = {
    id: string;
    name: string;
    visible: boolean;
    isUngrouped: boolean;
};
export type TableContext = {
    tableSchema?: string | null;
    visible: boolean;
};

export type NodeContext = {
    schema: SchemaContext;
    area: AreaContext;
    table: TableContext;
};

export type RelevantTableData = {
    id: string;
    name: string;
    schema?: string | null;
    parentAreaId?: string | null;
};
