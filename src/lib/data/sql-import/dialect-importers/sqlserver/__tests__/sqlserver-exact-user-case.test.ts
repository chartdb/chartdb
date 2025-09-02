import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Complex Fantasy Case', () => {
    it('should parse complex SQL with SpellDefinition and SpellComponent tables', async () => {
        // Complex SQL with same structure as user's case but fantasy-themed
        const sql = `CREATE TABLE [DBO].[SpellDefinition](
  [SPELLID]  (VARCHAR)(32),    
  [HASVERBALCOMP] BOOLEAN,  
  [INCANTATION] [VARCHAR](128),  
  [INCANTATIONFIX] BOOLEAN,  
  [ITSCOMPONENTREL]  [VARCHAR](32), FOREIGN KEY (itscomponentrel) REFERENCES SpellComponent(SPELLID), 
  [SHOWVISUALS] BOOLEAN,    ) ON [PRIMARY]

CREATE TABLE [DBO].[SpellComponent](
  [ALIAS] CHAR (50),    
  [SPELLID]  (VARCHAR)(32),    
  [ISOPTIONAL] BOOLEAN,  
  [ITSPARENTCOMP]  [VARCHAR](32), FOREIGN KEY (itsparentcomp) REFERENCES SpellComponent(SPELLID), 
  [ITSSCHOOLMETA]  [VARCHAR](32), FOREIGN KEY (itsschoolmeta) REFERENCES MagicSchool(SCHOOLID), 
  [KEYATTR] CHAR (100),  ) ON [PRIMARY]`;

        console.log('Testing complex fantasy SQL...');
        console.log(
            'Number of CREATE TABLE statements:',
            (sql.match(/CREATE\s+TABLE/gi) || []).length
        );

        const result = await fromSQLServer(sql);

        console.log(
            'Result tables:',
            result.tables.map((t) => t.name)
        );
        console.log('Result relationships:', result.relationships.length);

        // Debug: Show actual relationships
        if (result.relationships.length === 0) {
            console.log('WARNING: No relationships found!');
        } else {
            console.log('Relationships found:');
            result.relationships.forEach((r) => {
                console.log(
                    `  ${r.sourceTable}.${r.sourceColumn} -> ${r.targetTable}.${r.targetColumn}`
                );
            });
        }

        // Should create TWO tables
        expect(result.tables).toHaveLength(2);

        // Check first table
        const spellDef = result.tables.find(
            (t) => t.name === 'SpellDefinition'
        );
        expect(spellDef).toBeDefined();
        expect(spellDef?.schema).toBe('DBO');
        expect(spellDef?.columns).toHaveLength(6);

        // Check second table
        const spellComp = result.tables.find(
            (t) => t.name === 'SpellComponent'
        );
        expect(spellComp).toBeDefined();
        expect(spellComp?.schema).toBe('DBO');
        expect(spellComp?.columns).toHaveLength(6);

        // Check foreign key relationships (should have at least 2)
        expect(result.relationships.length).toBeGreaterThanOrEqual(2);

        // Check FK from SpellDefinition to SpellComponent
        const fkDefToComp = result.relationships.find(
            (r) =>
                r.sourceTable === 'SpellDefinition' &&
                r.targetTable === 'SpellComponent' &&
                r.sourceColumn === 'itscomponentrel'
        );
        expect(fkDefToComp).toBeDefined();
        expect(fkDefToComp?.targetColumn).toBe('SPELLID');

        // Check self-referential FK in SpellComponent
        const selfRefFK = result.relationships.find(
            (r) =>
                r.sourceTable === 'SpellComponent' &&
                r.targetTable === 'SpellComponent' &&
                r.sourceColumn === 'itsparentcomp'
        );
        expect(selfRefFK).toBeDefined();
        expect(selfRefFK?.targetColumn).toBe('SPELLID');
    });
});
