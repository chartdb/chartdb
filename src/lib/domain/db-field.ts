import { DataType } from '../data/data-types';

export interface DBField {
    id: string;
    name: string;
    type: DataType;
    primaryKey: boolean;
    unique: boolean;
    nullable: boolean;
    createdAt: number;
    characterMaximumLength?: string;
    precision?: number;
    scale?: number;
    default?: string;
    collation?: string;
    comments?: string;
}
