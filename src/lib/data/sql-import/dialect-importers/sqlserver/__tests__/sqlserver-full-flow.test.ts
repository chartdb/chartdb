import { describe, it, expect } from 'vitest';
import { sqlImportToDiagram } from '../../../index';
import { DatabaseType } from '@/lib/domain/database-type';

describe('SQL Server Full Import Flow', () => {
    it('should create relationships when importing through the full flow', async () => {
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

        // Test the full import flow as the application uses it
        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.SQL_SERVER,
            targetDatabaseType: DatabaseType.SQL_SERVER,
        });

        // Verify tables
        expect(diagram.tables).toHaveLength(2);
        const tableNames = diagram.tables?.map((t) => t.name).sort();
        expect(tableNames).toEqual(['SpellComponent', 'SpellDefinition']);

        // Verify relationships are created in the diagram
        expect(diagram.relationships).toBeDefined();
        expect(diagram.relationships?.length).toBeGreaterThanOrEqual(2);

        // Check specific relationships
        const fk1 = diagram.relationships?.find(
            (r) =>
                r.sourceFieldId &&
                r.targetFieldId && // Must have field IDs
                diagram.tables?.some(
                    (t) =>
                        t.id === r.targetTableId && t.name === 'SpellDefinition'
                )
        );
        expect(fk1).toBeDefined();

        const fk2 = diagram.relationships?.find(
            (r) =>
                r.sourceFieldId &&
                r.targetFieldId && // Must have field IDs
                diagram.tables?.some(
                    (t) =>
                        t.id === r.sourceTableId &&
                        t.name === 'SpellComponent' &&
                        t.id === r.targetTableId // self-reference
                )
        );
        expect(fk2).toBeDefined();
    });

    it('should handle case-insensitive field matching', async () => {
        const sql = `CREATE TABLE DragonLair (
  [LAIRID] INT PRIMARY KEY,
  [parentLairId] INT, FOREIGN KEY (PARENTLAIRID) REFERENCES DragonLair(lairid)
)`;

        const diagram = await sqlImportToDiagram({
            sqlContent: sql,
            sourceDatabaseType: DatabaseType.SQL_SERVER,
            targetDatabaseType: DatabaseType.SQL_SERVER,
        });

        // Should create the self-referential relationship despite case differences
        expect(diagram.relationships?.length).toBe(1);
    });
});
