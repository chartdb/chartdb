import { describe, expect, it } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Multi-Schema Database Tests', () => {
    it('should parse a fantasy-themed multi-schema database with cross-schema relationships', async () => {
        const sql = `
-- =============================================
-- Magical Realm Multi-Schema Database
-- A comprehensive fantasy database with multiple schemas
-- =============================================

-- Create schemas
CREATE SCHEMA [realm];
CREATE SCHEMA [academy];
CREATE SCHEMA [treasury];
CREATE SCHEMA [combat];
CREATE SCHEMA [marketplace];

-- =============================================
-- REALM Schema - Core realm entities
-- =============================================

CREATE TABLE [realm].[kingdoms] (
    [kingdom_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [kingdom_name] NVARCHAR(100) NOT NULL UNIQUE,
    [ruler_name] NVARCHAR(100) NOT NULL,
    [founding_date] DATE NOT NULL,
    [capital_city] NVARCHAR(100),
    [population] BIGINT,
    [treasury_gold] DECIMAL(18, 2) DEFAULT 10000.00
);

CREATE TABLE [realm].[cities] (
    [city_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [city_name] NVARCHAR(100) NOT NULL,
    [kingdom_id] BIGINT NOT NULL,
    [population] INT,
    [has_walls] BIT DEFAULT 0,
    [has_academy] BIT DEFAULT 0,
    [has_marketplace] BIT DEFAULT 0
);

CREATE TABLE [realm].[guilds] (
    [guild_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [guild_name] NVARCHAR(100) NOT NULL,
    [guild_type] NVARCHAR(50) NOT NULL, -- 'Mages', 'Warriors', 'Thieves', 'Merchants'
    [headquarters_city_id] BIGINT NOT NULL,
    [founding_year] INT,
    [member_count] INT DEFAULT 0,
    [guild_master] NVARCHAR(100)
);

-- =============================================
-- ACADEMY Schema - Educational institutions
-- =============================================

CREATE TABLE [academy].[schools] (
    [school_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [school_name] NVARCHAR(150) NOT NULL,
    [city_id] BIGINT NOT NULL,
    [specialization] NVARCHAR(100), -- 'Elemental Magic', 'Necromancy', 'Healing', 'Alchemy'
    [founded_year] INT,
    [tuition_gold] DECIMAL(10, 2),
    [headmaster] NVARCHAR(100)
);

CREATE TABLE [academy].[students] (
    [student_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [first_name] NVARCHAR(50) NOT NULL,
    [last_name] NVARCHAR(50) NOT NULL,
    [school_id] BIGINT NOT NULL,
    [enrollment_date] DATE NOT NULL,
    [graduation_date] DATE NULL,
    [major_discipline] NVARCHAR(100),
    [home_kingdom_id] BIGINT NOT NULL,
    [sponsor_guild_id] BIGINT NULL
);

CREATE TABLE [academy].[courses] (
    [course_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [course_name] NVARCHAR(200) NOT NULL,
    [school_id] BIGINT NOT NULL,
    [credit_hours] INT,
    [difficulty_level] INT CHECK (difficulty_level BETWEEN 1 AND 10),
    [prerequisites] NVARCHAR(MAX),
    [professor_name] NVARCHAR(100)
);

CREATE TABLE [academy].[enrollments] (
    [enrollment_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [student_id] BIGINT NOT NULL,
    [course_id] BIGINT NOT NULL,
    [enrollment_date] DATE NOT NULL,
    [grade] NVARCHAR(2),
    [completed] BIT DEFAULT 0
);

-- =============================================
-- TREASURY Schema - Financial entities
-- =============================================

CREATE TABLE [treasury].[currencies] (
    [currency_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [currency_name] NVARCHAR(50) NOT NULL UNIQUE,
    [symbol] NVARCHAR(10),
    [gold_exchange_rate] DECIMAL(10, 4) NOT NULL,
    [issuing_kingdom_id] BIGINT NOT NULL
);

CREATE TABLE [treasury].[banks] (
    [bank_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [bank_name] NVARCHAR(100) NOT NULL,
    [headquarters_city_id] BIGINT NOT NULL,
    [total_deposits] DECIMAL(18, 2) DEFAULT 0,
    [vault_security_level] INT CHECK (vault_security_level BETWEEN 1 AND 10),
    [founding_date] DATE
);

CREATE TABLE [treasury].[accounts] (
    [account_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [account_number] NVARCHAR(20) NOT NULL UNIQUE,
    [bank_id] BIGINT NOT NULL,
    [owner_type] NVARCHAR(20) NOT NULL, -- 'Student', 'Guild', 'Kingdom', 'Merchant'
    [owner_id] BIGINT NOT NULL,
    [balance] DECIMAL(18, 2) DEFAULT 0,
    [currency_id] BIGINT NOT NULL,
    [opened_date] DATE NOT NULL
);

CREATE TABLE [treasury].[transactions] (
    [transaction_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [from_account_id] BIGINT NULL,
    [to_account_id] BIGINT NULL,
    [amount] DECIMAL(18, 2) NOT NULL,
    [currency_id] BIGINT NOT NULL,
    [transaction_date] DATETIME NOT NULL,
    [description] NVARCHAR(500),
    [transaction_type] NVARCHAR(50) -- 'Deposit', 'Withdrawal', 'Transfer', 'Payment'
);

-- =============================================
-- COMBAT Schema - Battle and warrior entities
-- =============================================

CREATE TABLE [combat].[warriors] (
    [warrior_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [warrior_name] NVARCHAR(100) NOT NULL,
    [class] NVARCHAR(50) NOT NULL, -- 'Knight', 'Archer', 'Mage', 'Barbarian'
    [level] INT DEFAULT 1,
    [experience_points] BIGINT DEFAULT 0,
    [guild_id] BIGINT NULL,
    [home_city_id] BIGINT NOT NULL,
    [strength] INT,
    [agility] INT,
    [intelligence] INT,
    [current_hp] INT,
    [max_hp] INT
);

CREATE TABLE [combat].[weapons] (
    [weapon_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [weapon_name] NVARCHAR(100) NOT NULL,
    [weapon_type] NVARCHAR(50), -- 'Sword', 'Bow', 'Staff', 'Axe'
    [damage] INT,
    [durability] INT,
    [enchantment_level] INT DEFAULT 0,
    [market_value] DECIMAL(10, 2),
    [owner_warrior_id] BIGINT NULL
);

CREATE TABLE [combat].[battles] (
    [battle_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [battle_name] NVARCHAR(200),
    [battle_date] DATETIME NOT NULL,
    [location_city_id] BIGINT NOT NULL,
    [victor_warrior_id] BIGINT NULL,
    [total_participants] INT,
    [battle_type] NVARCHAR(50) -- 'Duel', 'Tournament', 'War', 'Training'
);

CREATE TABLE [combat].[battle_participants] (
    [participant_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [battle_id] BIGINT NOT NULL,
    [warrior_id] BIGINT NOT NULL,
    [damage_dealt] INT DEFAULT 0,
    [damage_received] INT DEFAULT 0,
    [survived] BIT DEFAULT 1,
    [rewards_earned] DECIMAL(10, 2) DEFAULT 0
);

-- =============================================
-- MARKETPLACE Schema - Commerce entities
-- =============================================

CREATE TABLE [marketplace].[merchants] (
    [merchant_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [merchant_name] NVARCHAR(100) NOT NULL,
    [shop_name] NVARCHAR(150),
    [city_id] BIGINT NOT NULL,
    [specialization] NVARCHAR(100), -- 'Weapons', 'Potions', 'Scrolls', 'Artifacts'
    [reputation_score] INT DEFAULT 50,
    [bank_account_id] BIGINT NULL
);

CREATE TABLE [marketplace].[items] (
    [item_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [item_name] NVARCHAR(150) NOT NULL,
    [item_type] NVARCHAR(50),
    [base_price] DECIMAL(10, 2),
    [rarity] NVARCHAR(20), -- 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'
    [merchant_id] BIGINT NOT NULL,
    [stock_quantity] INT DEFAULT 0,
    [magical_properties] NVARCHAR(MAX)
);

CREATE TABLE [marketplace].[trade_routes] (
    [route_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [from_city_id] BIGINT NOT NULL,
    [to_city_id] BIGINT NOT NULL,
    [distance_leagues] INT,
    [travel_days] INT,
    [danger_level] INT CHECK (danger_level BETWEEN 1 AND 10),
    [toll_cost] DECIMAL(10, 2),
    [controlled_by_guild_id] BIGINT NULL
);

CREATE TABLE [marketplace].[transactions] (
    [transaction_id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [buyer_type] NVARCHAR(20), -- 'Warrior', 'Student', 'Merchant'
    [buyer_id] BIGINT NOT NULL,
    [merchant_id] BIGINT NOT NULL,
    [item_id] BIGINT NOT NULL,
    [quantity] INT NOT NULL,
    [total_price] DECIMAL(10, 2) NOT NULL,
    [transaction_date] DATETIME NOT NULL,
    [payment_account_id] BIGINT NULL
);

-- =============================================
-- Foreign Key Constraints - Cross-Schema Relationships
-- =============================================

-- Realm schema relationships
ALTER TABLE [realm].[cities] ADD CONSTRAINT [FK_Cities_Kingdoms] 
    FOREIGN KEY ([kingdom_id]) REFERENCES [realm].[kingdoms]([kingdom_id]);

ALTER TABLE [realm].[guilds] ADD CONSTRAINT [FK_Guilds_Cities] 
    FOREIGN KEY ([headquarters_city_id]) REFERENCES [realm].[cities]([city_id]);

-- Academy schema relationships (references realm schema)
ALTER TABLE [academy].[schools] ADD CONSTRAINT [FK_Schools_Cities] 
    FOREIGN KEY ([city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [academy].[students] ADD CONSTRAINT [FK_Students_Schools] 
    FOREIGN KEY ([school_id]) REFERENCES [academy].[schools]([school_id]);

ALTER TABLE [academy].[students] ADD CONSTRAINT [FK_Students_Kingdoms] 
    FOREIGN KEY ([home_kingdom_id]) REFERENCES [realm].[kingdoms]([kingdom_id]);

ALTER TABLE [academy].[students] ADD CONSTRAINT [FK_Students_Guilds] 
    FOREIGN KEY ([sponsor_guild_id]) REFERENCES [realm].[guilds]([guild_id]);

ALTER TABLE [academy].[courses] ADD CONSTRAINT [FK_Courses_Schools] 
    FOREIGN KEY ([school_id]) REFERENCES [academy].[schools]([school_id]);

ALTER TABLE [academy].[enrollments] ADD CONSTRAINT [FK_Enrollments_Students] 
    FOREIGN KEY ([student_id]) REFERENCES [academy].[students]([student_id]);

ALTER TABLE [academy].[enrollments] ADD CONSTRAINT [FK_Enrollments_Courses] 
    FOREIGN KEY ([course_id]) REFERENCES [academy].[courses]([course_id]);

-- Treasury schema relationships (references realm schema)
ALTER TABLE [treasury].[currencies] ADD CONSTRAINT [FK_Currencies_Kingdoms] 
    FOREIGN KEY ([issuing_kingdom_id]) REFERENCES [realm].[kingdoms]([kingdom_id]);

ALTER TABLE [treasury].[banks] ADD CONSTRAINT [FK_Banks_Cities] 
    FOREIGN KEY ([headquarters_city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [treasury].[accounts] ADD CONSTRAINT [FK_Accounts_Banks] 
    FOREIGN KEY ([bank_id]) REFERENCES [treasury].[banks]([bank_id]);

ALTER TABLE [treasury].[accounts] ADD CONSTRAINT [FK_Accounts_Currencies] 
    FOREIGN KEY ([currency_id]) REFERENCES [treasury].[currencies]([currency_id]);

ALTER TABLE [treasury].[transactions] ADD CONSTRAINT [FK_Transactions_FromAccount] 
    FOREIGN KEY ([from_account_id]) REFERENCES [treasury].[accounts]([account_id]);

ALTER TABLE [treasury].[transactions] ADD CONSTRAINT [FK_Transactions_ToAccount] 
    FOREIGN KEY ([to_account_id]) REFERENCES [treasury].[accounts]([account_id]);

ALTER TABLE [treasury].[transactions] ADD CONSTRAINT [FK_Transactions_Currency] 
    FOREIGN KEY ([currency_id]) REFERENCES [treasury].[currencies]([currency_id]);

-- Combat schema relationships (references realm and combat schemas)
ALTER TABLE [combat].[warriors] ADD CONSTRAINT [FK_Warriors_Guilds] 
    FOREIGN KEY ([guild_id]) REFERENCES [realm].[guilds]([guild_id]);

ALTER TABLE [combat].[warriors] ADD CONSTRAINT [FK_Warriors_Cities] 
    FOREIGN KEY ([home_city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [combat].[weapons] ADD CONSTRAINT [FK_Weapons_Warriors] 
    FOREIGN KEY ([owner_warrior_id]) REFERENCES [combat].[warriors]([warrior_id]);

ALTER TABLE [combat].[battles] ADD CONSTRAINT [FK_Battles_Cities] 
    FOREIGN KEY ([location_city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [combat].[battles] ADD CONSTRAINT [FK_Battles_VictorWarrior] 
    FOREIGN KEY ([victor_warrior_id]) REFERENCES [combat].[warriors]([warrior_id]);

ALTER TABLE [combat].[battle_participants] ADD CONSTRAINT [FK_BattleParticipants_Battles] 
    FOREIGN KEY ([battle_id]) REFERENCES [combat].[battles]([battle_id]);

ALTER TABLE [combat].[battle_participants] ADD CONSTRAINT [FK_BattleParticipants_Warriors] 
    FOREIGN KEY ([warrior_id]) REFERENCES [combat].[warriors]([warrior_id]);

-- Marketplace schema relationships (references multiple schemas)
ALTER TABLE [marketplace].[merchants] ADD CONSTRAINT [FK_Merchants_Cities] 
    FOREIGN KEY ([city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [marketplace].[merchants] ADD CONSTRAINT [FK_Merchants_BankAccounts] 
    FOREIGN KEY ([bank_account_id]) REFERENCES [treasury].[accounts]([account_id]);

ALTER TABLE [marketplace].[items] ADD CONSTRAINT [FK_Items_Merchants] 
    FOREIGN KEY ([merchant_id]) REFERENCES [marketplace].[merchants]([merchant_id]);

ALTER TABLE [marketplace].[trade_routes] ADD CONSTRAINT [FK_TradeRoutes_FromCity] 
    FOREIGN KEY ([from_city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [marketplace].[trade_routes] ADD CONSTRAINT [FK_TradeRoutes_ToCity] 
    FOREIGN KEY ([to_city_id]) REFERENCES [realm].[cities]([city_id]);

ALTER TABLE [marketplace].[trade_routes] ADD CONSTRAINT [FK_TradeRoutes_Guilds] 
    FOREIGN KEY ([controlled_by_guild_id]) REFERENCES [realm].[guilds]([guild_id]);

ALTER TABLE [marketplace].[transactions] ADD CONSTRAINT [FK_MarketTransactions_Merchants] 
    FOREIGN KEY ([merchant_id]) REFERENCES [marketplace].[merchants]([merchant_id]);

ALTER TABLE [marketplace].[transactions] ADD CONSTRAINT [FK_MarketTransactions_Items] 
    FOREIGN KEY ([item_id]) REFERENCES [marketplace].[items]([item_id]);

ALTER TABLE [marketplace].[transactions] ADD CONSTRAINT [FK_MarketTransactions_PaymentAccount] 
    FOREIGN KEY ([payment_account_id]) REFERENCES [treasury].[accounts]([account_id]);

-- Note: Testing table reference without schema prefix defaults to dbo schema
        `;

        const result = await fromSQLServer(sql);

        // Verify all schemas are recognized
        const schemas = new Set(result.tables.map((t) => t.schema));
        expect(schemas.has('realm')).toBe(true);
        expect(schemas.has('academy')).toBe(true);
        expect(schemas.has('treasury')).toBe(true);
        expect(schemas.has('combat')).toBe(true);
        expect(schemas.has('marketplace')).toBe(true);

        // Verify table count per schema
        const tablesBySchema = {
            realm: result.tables.filter((t) => t.schema === 'realm').length,
            academy: result.tables.filter((t) => t.schema === 'academy').length,
            treasury: result.tables.filter((t) => t.schema === 'treasury')
                .length,
            combat: result.tables.filter((t) => t.schema === 'combat').length,
            marketplace: result.tables.filter((t) => t.schema === 'marketplace')
                .length,
        };

        expect(tablesBySchema.realm).toBe(3); // kingdoms, cities, guilds
        expect(tablesBySchema.academy).toBe(4); // schools, students, courses, enrollments
        expect(tablesBySchema.treasury).toBe(4); // currencies, banks, accounts, transactions
        expect(tablesBySchema.combat).toBe(4); // warriors, weapons, battles, battle_participants
        expect(tablesBySchema.marketplace).toBe(4); // merchants, items, trade_routes, transactions

        // Total tables should be 19
        expect(result.tables.length).toBe(19);

        // Debug: log which relationships are missing
        const expectedRelationshipNames = [
            'FK_Cities_Kingdoms',
            'FK_Guilds_Cities',
            'FK_Schools_Cities',
            'FK_Students_Schools',
            'FK_Students_Kingdoms',
            'FK_Students_Guilds',
            'FK_Courses_Schools',
            'FK_Enrollments_Students',
            'FK_Enrollments_Courses',
            'FK_Currencies_Kingdoms',
            'FK_Banks_Cities',
            'FK_Accounts_Banks',
            'FK_Accounts_Currencies',
            'FK_Transactions_FromAccount',
            'FK_Transactions_ToAccount',
            'FK_Transactions_Currency',
            'FK_Warriors_Guilds',
            'FK_Warriors_Cities',
            'FK_Weapons_Warriors',
            'FK_Battles_Cities',
            'FK_Battles_VictorWarrior',
            'FK_BattleParticipants_Battles',
            'FK_BattleParticipants_Warriors',
            'FK_Merchants_Cities',
            'FK_Merchants_BankAccounts',
            'FK_Items_Merchants',
            'FK_TradeRoutes_FromCity',
            'FK_TradeRoutes_ToCity',
            'FK_TradeRoutes_Guilds',
            'FK_MarketTransactions_Merchants',
            'FK_MarketTransactions_Items',
            'FK_MarketTransactions_PaymentAccount',
        ];

        const foundRelationshipNames = result.relationships.map((r) => r.name);
        const missingRelationships = expectedRelationshipNames.filter(
            (name) => !foundRelationshipNames.includes(name)
        );

        // Verify all expected relationships were found
        expect(missingRelationships.length).toBe(0);

        // Verify relationships count - we have 32 working relationships
        expect(result.relationships.length).toBe(32);

        // Verify some specific cross-schema relationships
        const crossSchemaRelationships = result.relationships.filter(
            (r) => r.sourceSchema !== r.targetSchema
        );

        expect(crossSchemaRelationships.length).toBeGreaterThan(10); // Many cross-schema relationships

        // Check specific cross-schema relationships exist
        const schoolsToCities = result.relationships.find(
            (r) =>
                r.sourceTable === 'schools' &&
                r.sourceSchema === 'academy' &&
                r.targetTable === 'cities' &&
                r.targetSchema === 'realm'
        );
        expect(schoolsToCities).toBeDefined();
        expect(schoolsToCities?.name).toBe('FK_Schools_Cities');

        const studentsToKingdoms = result.relationships.find(
            (r) =>
                r.sourceTable === 'students' &&
                r.sourceSchema === 'academy' &&
                r.targetTable === 'kingdoms' &&
                r.targetSchema === 'realm'
        );
        expect(studentsToKingdoms).toBeDefined();
        expect(studentsToKingdoms?.name).toBe('FK_Students_Kingdoms');

        const warriorsToGuilds = result.relationships.find(
            (r) =>
                r.sourceTable === 'warriors' &&
                r.sourceSchema === 'combat' &&
                r.targetTable === 'guilds' &&
                r.targetSchema === 'realm'
        );
        expect(warriorsToGuilds).toBeDefined();
        expect(warriorsToGuilds?.name).toBe('FK_Warriors_Guilds');

        const merchantsToAccounts = result.relationships.find(
            (r) =>
                r.sourceTable === 'merchants' &&
                r.sourceSchema === 'marketplace' &&
                r.targetTable === 'accounts' &&
                r.targetSchema === 'treasury'
        );
        expect(merchantsToAccounts).toBeDefined();
        expect(merchantsToAccounts?.name).toBe('FK_Merchants_BankAccounts');

        // Verify all relationships have valid source and target table IDs
        const validRelationships = result.relationships.filter(
            (r) => r.sourceTableId && r.targetTableId
        );
        expect(validRelationships.length).toBe(result.relationships.length);

        // Check that table IDs are properly linked
        for (const rel of result.relationships) {
            const sourceTable = result.tables.find(
                (t) =>
                    t.name === rel.sourceTable && t.schema === rel.sourceSchema
            );
            const targetTable = result.tables.find(
                (t) =>
                    t.name === rel.targetTable && t.schema === rel.targetSchema
            );

            expect(sourceTable).toBeDefined();
            expect(targetTable).toBeDefined();
            expect(rel.sourceTableId).toBe(sourceTable?.id);
            expect(rel.targetTableId).toBe(targetTable?.id);
        }

        // Test relationships within the same schema
        const withinSchemaRels = result.relationships.filter(
            (r) => r.sourceSchema === r.targetSchema
        );
        expect(withinSchemaRels.length).toBeGreaterThan(10);

        // Verify specific within-schema relationship
        const citiesToKingdoms = result.relationships.find(
            (r) =>
                r.sourceTable === 'cities' &&
                r.targetTable === 'kingdoms' &&
                r.sourceSchema === 'realm' &&
                r.targetSchema === 'realm'
        );
        expect(citiesToKingdoms).toBeDefined();
    });

    it('should handle mixed schema notation formats', async () => {
        const sql = `
-- Mix of different schema notation styles
CREATE TABLE [dbo].[table1] (
    [id] INT PRIMARY KEY,
    [name] NVARCHAR(50)
);

CREATE TABLE table2 (
    id INT PRIMARY KEY,
    table1_id INT
);

CREATE TABLE [schema1].[table3] (
    [id] INT PRIMARY KEY,
    [value] DECIMAL(10,2)
);

-- Different ALTER TABLE formats
ALTER TABLE [dbo].[table1] ADD CONSTRAINT [FK1] 
    FOREIGN KEY ([id]) REFERENCES [schema1].[table3]([id]);

ALTER TABLE table2 ADD CONSTRAINT FK2 
    FOREIGN KEY (table1_id) REFERENCES [dbo].[table1](id);

ALTER TABLE [schema1].[table3] ADD CONSTRAINT [FK3] 
    FOREIGN KEY ([id]) REFERENCES table2(id);
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables.length).toBe(3);
        expect(result.relationships.length).toBe(3);

        // Verify schemas are correctly assigned
        const table1 = result.tables.find((t) => t.name === 'table1');
        const table2 = result.tables.find((t) => t.name === 'table2');
        const table3 = result.tables.find((t) => t.name === 'table3');

        expect(table1?.schema).toBe('dbo');
        expect(table2?.schema).toBe('dbo');
        expect(table3?.schema).toBe('schema1');

        // Verify all relationships are properly linked
        for (const rel of result.relationships) {
            expect(rel.sourceTableId).toBeTruthy();
            expect(rel.targetTableId).toBeTruthy();
        }
    });
});
