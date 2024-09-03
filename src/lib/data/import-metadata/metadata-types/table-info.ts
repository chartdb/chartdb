export interface TableInfo {
    schema: string;
    table: string;
    rows: number;
    type: string;
    engine: string;
    collation: string;
    comment?: string;
}
