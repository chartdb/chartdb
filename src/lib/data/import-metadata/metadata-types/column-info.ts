export interface ColumnInfo {
    schema: string;
    table: string;
    name: string;
    type: string;
    ordinal_position: number;
    nullable: boolean;
    collation: string;
}
