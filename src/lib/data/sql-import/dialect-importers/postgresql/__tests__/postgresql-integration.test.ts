import { describe, it, expect, vi, afterEach } from 'vitest';
import { fromPostgres } from '../postgresql';
import * as improvedModule from '../postgresql-improved';

// Spy on the improved parser
const fromPostgresImprovedSpy = vi.spyOn(
    improvedModule,
    'fromPostgresImproved'
);

describe('PostgreSQL Parser Integration', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should use standard parser for simple SQL', async () => {
        const sql = `
            CREATE TABLE wizards (
                id INTEGER PRIMARY KEY,
                name VARCHAR(255)
            );
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('wizards');

        // Should NOT use improved parser for simple SQL
        expect(fromPostgresImprovedSpy).not.toHaveBeenCalled();
    });

    it('should fall back to improved parser when functions are present', async () => {
        const sql = `
            CREATE TABLE wizards (id INTEGER PRIMARY KEY);
            
            CREATE FUNCTION get_wizard() RETURNS INTEGER AS $$
            BEGIN
                RETURN 1;
            END;
            $$ LANGUAGE plpgsql;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);
        expect(result.tables[0].name).toBe('wizards');

        // Should use improved parser when functions are detected
        expect(fromPostgresImprovedSpy).toHaveBeenCalledWith(sql);
    });

    it('should fall back to improved parser when policies are present', async () => {
        const sql = `
            CREATE TABLE ancient_scrolls (id INTEGER PRIMARY KEY);
            
            CREATE POLICY wizard_policy ON ancient_scrolls
                FOR SELECT
                USING (true);
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);

        // Should use improved parser when policies are detected
        expect(fromPostgresImprovedSpy).toHaveBeenCalledWith(sql);
    });

    it('should fall back to improved parser when RLS is present', async () => {
        const sql = `
            CREATE TABLE enchanted_vault (id INTEGER PRIMARY KEY);
            ALTER TABLE enchanted_vault ENABLE ROW LEVEL SECURITY;
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);

        // Should use improved parser when RLS is detected
        expect(fromPostgresImprovedSpy).toHaveBeenCalledWith(sql);
    });

    it('should fall back to improved parser when triggers are present', async () => {
        const sql = `
            CREATE TABLE spell_log (id INTEGER PRIMARY KEY);
            
            CREATE TRIGGER spell_trigger
                AFTER INSERT ON spell_log
                FOR EACH ROW
                EXECUTE FUNCTION spell_func();
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(1);

        // Should use improved parser when triggers are detected
        expect(fromPostgresImprovedSpy).toHaveBeenCalledWith(sql);
    });

    it('should preserve all relationships when using improved parser', async () => {
        const sql = `
            CREATE TABLE guilds (id INTEGER PRIMARY KEY);
            CREATE TABLE wizards (
                id INTEGER PRIMARY KEY,
                guild_id INTEGER REFERENCES guilds(id)
            );
            
            -- This function should trigger improved parser
            CREATE FUNCTION dummy() RETURNS VOID AS $$ BEGIN END; $$ LANGUAGE plpgsql;
            
            CREATE TABLE quests (
                id INTEGER PRIMARY KEY,
                wizard_id INTEGER REFERENCES wizards(id),
                guild_id INTEGER REFERENCES guilds(id)
            );
        `;

        const result = await fromPostgres(sql);

        expect(result.tables).toHaveLength(3);
        expect(result.relationships).toHaveLength(3);

        // Verify all relationships are preserved
        expect(
            result.relationships.some(
                (r) => r.sourceTable === 'wizards' && r.targetTable === 'guilds'
            )
        ).toBe(true);
        expect(
            result.relationships.some(
                (r) => r.sourceTable === 'quests' && r.targetTable === 'wizards'
            )
        ).toBe(true);
        expect(
            result.relationships.some(
                (r) => r.sourceTable === 'quests' && r.targetTable === 'guilds'
            )
        ).toBe(true);

        // Should have used improved parser
        expect(fromPostgresImprovedSpy).toHaveBeenCalled();
    });
});
