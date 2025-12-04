import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('Minimal junction table test', () => {
    it('should parse junction table with exact SQL structure', async () => {
        // Junction table for tracking which dragons have been tamed by which dragon masters
        const sql = `-- Junction table for tracking dragon-master bonds.
CREATE TABLE dragon_bonds (
    dragon_master_id UUID NOT NULL REFERENCES dragon_masters(id) ON DELETE CASCADE,
    dragon_id UUID NOT NULL REFERENCES dragons(id) ON DELETE CASCADE,
    PRIMARY KEY (dragon_master_id, dragon_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('dragon_bonds');
    });

    it('should parse without the comment', async () => {
        const sql = `CREATE TABLE dragon_bonds (
    dragon_master_id UUID NOT NULL REFERENCES dragon_masters(id) ON DELETE CASCADE,
    dragon_id UUID NOT NULL REFERENCES dragons(id) ON DELETE CASCADE,
    PRIMARY KEY (dragon_master_id, dragon_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('dragon_bonds');
    });

    it('should parse with dependencies', async () => {
        const sql = `
CREATE TABLE dragon_masters (
    id UUID PRIMARY KEY
);

CREATE TABLE dragons (
    id UUID PRIMARY KEY  
);

-- Junction table for tracking dragon-master bonds.
CREATE TABLE dragon_bonds (
    dragon_master_id UUID NOT NULL REFERENCES dragon_masters(id) ON DELETE CASCADE,
    dragon_id UUID NOT NULL REFERENCES dragons(id) ON DELETE CASCADE,
    PRIMARY KEY (dragon_master_id, dragon_id)
);`;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        const dragonBonds = result.tables.find(
            (t) => t.name === 'dragon_bonds'
        );
        expect(dragonBonds).toBeDefined();
    });
});
