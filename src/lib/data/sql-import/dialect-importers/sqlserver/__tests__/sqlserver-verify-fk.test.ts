import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server FK Verification', () => {
    it('should correctly parse FKs from complex fantasy SQL', async () => {
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

        const result = await fromSQLServer(sql);

        // Verify tables
        expect(result.tables).toHaveLength(2);
        expect(result.tables.map((t) => t.name).sort()).toEqual([
            'SpellComponent',
            'SpellDefinition',
        ]);

        // Verify that FKs were found (even if MagicSchool doesn't exist)
        // The parsing should find 3 FKs initially, but linkRelationships will filter out the one to MagicSchool
        expect(result.relationships.length).toBeGreaterThanOrEqual(2);

        // Verify specific FKs that should exist
        const fk1 = result.relationships.find(
            (r) =>
                r.sourceTable === 'SpellDefinition' &&
                r.sourceColumn.toLowerCase() === 'itscomponentrel' &&
                r.targetTable === 'SpellComponent'
        );
        expect(fk1).toBeDefined();
        expect(fk1?.targetColumn).toBe('SPELLID');
        expect(fk1?.sourceTableId).toBeTruthy();
        expect(fk1?.targetTableId).toBeTruthy();

        const fk2 = result.relationships.find(
            (r) =>
                r.sourceTable === 'SpellComponent' &&
                r.sourceColumn.toLowerCase() === 'itsparentcomp' &&
                r.targetTable === 'SpellComponent'
        );
        expect(fk2).toBeDefined();
        expect(fk2?.targetColumn).toBe('SPELLID');
        expect(fk2?.sourceTableId).toBeTruthy();
        expect(fk2?.targetTableId).toBeTruthy();
    });

    it('should parse inline FOREIGN KEY syntax correctly', async () => {
        // Simplified test with just one FK to ensure parsing works
        const sql = `CREATE TABLE [DBO].[WizardTower](
  [TOWERID] INT,
  [MASTERKEY] [VARCHAR](32), FOREIGN KEY (MASTERKEY) REFERENCES ArcaneGuild(GUILDID),
  [NAME] VARCHAR(100)
) ON [PRIMARY]

CREATE TABLE [DBO].[ArcaneGuild](
  [GUILDID] [VARCHAR](32),
  [GUILDNAME] VARCHAR(100)
) ON [PRIMARY]`;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0].sourceColumn).toBe('MASTERKEY');
        expect(result.relationships[0].targetColumn).toBe('GUILDID');
    });
});
