export interface ColumnInfo {
    schema: string;
    table: string;
    name: string;
    type: string;
    ordinal_position: number;
    nullable: boolean;
    character_maximum_length?: string | null; // The maximum length of the column (if applicable), nullable
    precision?: {
        precision: number | null; // The precision for numeric types
        scale: number | null; // The scale for numeric types
    } | null; // Nullable, not all types have precision
    default?: string | null; // Default value for the column, nullable
    collation?: string | null;
    comment?: string | null;
}
