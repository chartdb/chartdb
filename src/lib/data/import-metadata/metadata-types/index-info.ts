export interface IndexInfo {
    schema: string;
    table: string;
    name: string;
    column: string;
    index_type: string;
    cardinality: number;
    size: number;
    unique: boolean;
    is_partial_index: boolean;
    direction: string;
}
