import { dataTypes } from '../data/data-types';

export interface DBField {
    id: string;
    name: string;
    type: FieldType;
    primaryKey: boolean;
    unique: boolean;
    nullable: boolean;
    createdAt: number;
}

export type FieldType = (typeof dataTypes)[number];
