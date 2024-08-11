import { DBIndex } from './db-index';
import { DBField } from './db-field';

export interface DBTable {
    id: string;
    name: string;
    x: number;
    y: number;
    fields: DBField[];
    indexes: DBIndex[];
    color: string;
    createdAt: number;
}
