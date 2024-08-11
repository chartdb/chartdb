import { DBField } from './db-field';

export interface DBIndex {
    id: string;
    name: string;
    unique: boolean;
    fieldIds: string[];
    fields?: DBField[];
}
