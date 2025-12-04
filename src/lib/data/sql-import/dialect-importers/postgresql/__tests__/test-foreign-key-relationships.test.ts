import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Relationships Debug', () => {
    it('should parse simple foreign key', async () => {
        const sql = `
CREATE TABLE wizards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

CREATE TABLE towers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES wizards(id) ON DELETE CASCADE
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceTable).toBe('towers');
        expect(result.relationships[0].targetTable).toBe('wizards');
    });

    it('should handle custom types and foreign keys', async () => {
        const sql = `
CREATE TYPE quest_status AS ENUM ('active', 'paused', 'completed');

CREATE TABLE wizards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wizard_id UUID NOT NULL REFERENCES wizards(id) ON DELETE CASCADE,
    status quest_status DEFAULT 'active'
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
    });
});
