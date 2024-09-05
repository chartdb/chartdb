export interface ForeignKeyInfo {
    schema: string;
    table: string;
    column: string;
    foreign_key_name: string;
    reference_schema?: string;
    reference_table: string;
    reference_column: string;
    fk_def: string;
}
