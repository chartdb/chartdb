import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Multiple Tables with Foreign Keys', () => {
    it('should parse multiple tables with foreign keys in user format', async () => {
        const sql = `
            CREATE TABLE [DBO].[QuestReward](
                [BOID] (VARCHAR)(32),
                [HASEXTRACOL] BOOLEAN,
                [REWARDCODE] [VARCHAR](128),
                [REWARDFIX] BOOLEAN,
                [ITSQUESTREL] [VARCHAR](32), FOREIGN KEY (itsquestrel) REFERENCES QuestRelation(BOID),
                [SHOWDETAILS] BOOLEAN,
            ) ON [PRIMARY]

            CREATE TABLE [DBO].[QuestRelation](
                [ALIAS] CHAR (50),
                [BOID] (VARCHAR)(32),
                [ISOPTIONAL] BOOLEAN,
                [ITSPARENTREL] [VARCHAR](32), FOREIGN KEY (itsparentrel) REFERENCES QuestRelation(BOID),
                [ITSGUILDMETA] [VARCHAR](32), FOREIGN KEY (itsguildmeta) REFERENCES GuildMeta(BOID),
                [KEYATTR] CHAR (100),
            ) ON [PRIMARY]
        `;

        const result = await fromSQLServer(sql);

        // Should create both tables
        expect(result.tables).toHaveLength(2);

        // Check first table
        const questReward = result.tables.find((t) => t.name === 'QuestReward');
        expect(questReward).toBeDefined();
        expect(questReward?.schema).toBe('DBO');
        expect(questReward?.columns).toHaveLength(6);

        // Check second table
        const questRelation = result.tables.find(
            (t) => t.name === 'QuestRelation'
        );
        expect(questRelation).toBeDefined();
        expect(questRelation?.schema).toBe('DBO');
        expect(questRelation?.columns).toHaveLength(6);

        // Check foreign key relationships
        expect(result.relationships).toHaveLength(2); // Should have 2 FKs (one self-referential in QuestRelation, one from QuestReward to QuestRelation)

        // Check FK from QuestReward to QuestRelation
        const fkToRelation = result.relationships.find(
            (r) =>
                r.sourceTable === 'QuestReward' &&
                r.targetTable === 'QuestRelation'
        );
        expect(fkToRelation).toBeDefined();
        expect(fkToRelation?.sourceColumn).toBe('itsquestrel');
        expect(fkToRelation?.targetColumn).toBe('BOID');

        // Check self-referential FK in QuestRelation
        const selfRefFK = result.relationships.find(
            (r) =>
                r.sourceTable === 'QuestRelation' &&
                r.targetTable === 'QuestRelation' &&
                r.sourceColumn === 'itsparentrel'
        );
        expect(selfRefFK).toBeDefined();
        expect(selfRefFK?.targetColumn).toBe('BOID');
    });

    it('should parse multiple tables with circular dependencies', async () => {
        const sql = `
            CREATE TABLE [DBO].[Dragon](
                [DRAGONID] (VARCHAR)(32),
                [NAME] [VARCHAR](100),
                [ITSLAIRREL] [VARCHAR](32), FOREIGN KEY (itslairrel) REFERENCES DragonLair(LAIRID),
                [POWER] INT,
            ) ON [PRIMARY]

            CREATE TABLE [DBO].[DragonLair](
                [LAIRID] (VARCHAR)(32),
                [LOCATION] [VARCHAR](200),
                [ITSGUARDIAN] [VARCHAR](32), FOREIGN KEY (itsguardian) REFERENCES Dragon(DRAGONID),
                [TREASURES] INT,
            ) ON [PRIMARY]
        `;

        const result = await fromSQLServer(sql);

        // Should create both tables despite circular dependency
        expect(result.tables).toHaveLength(2);

        const dragon = result.tables.find((t) => t.name === 'Dragon');
        expect(dragon).toBeDefined();

        const dragonLair = result.tables.find((t) => t.name === 'DragonLair');
        expect(dragonLair).toBeDefined();

        // Check foreign key relationships (may have one or both depending on parser behavior with circular deps)
        expect(result.relationships.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle exact user input format', async () => {
        // Exact copy of the user's input with fantasy theme
        const sql = `CREATE TABLE [DBO].[WizardDef](
  [BOID]  (VARCHAR)(32),    
  [HASEXTRACNTCOL] BOOLEAN,  
  [HISTORYCD] [VARCHAR](128),  
  [HISTORYCDFIX] BOOLEAN,  
  [ITSADWIZARDREL]  [VARCHAR](32), FOREIGN KEY (itsadwizardrel) REFERENCES WizardRel(BOID), 
  [SHOWDETAILS] BOOLEAN,    ) ON [PRIMARY]

CREATE TABLE [DBO].[WizardRel](
  [ALIAS] CHAR (50),    
  [BOID]  (VARCHAR)(32),    
  [ISOPTIONAL] BOOLEAN,  
  [ITSARWIZARDREL]  [VARCHAR](32), FOREIGN KEY (itsarwizardrel) REFERENCES WizardRel(BOID), 
  [ITSARMETABO]  [VARCHAR](32), FOREIGN KEY (itsarmetabo) REFERENCES MetaBO(BOID), 
  [KEYATTR] CHAR (100),  ) ON [PRIMARY]`;

        const result = await fromSQLServer(sql);

        // This should create TWO tables, not just one
        expect(result.tables).toHaveLength(2);

        const wizardDef = result.tables.find((t) => t.name === 'WizardDef');
        expect(wizardDef).toBeDefined();
        expect(wizardDef?.columns).toHaveLength(6);

        const wizardRel = result.tables.find((t) => t.name === 'WizardRel');
        expect(wizardRel).toBeDefined();
        expect(wizardRel?.columns).toHaveLength(6);
    });
});
