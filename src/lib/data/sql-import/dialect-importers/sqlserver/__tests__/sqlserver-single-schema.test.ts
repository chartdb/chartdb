import { describe, expect, it } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Single-Schema Database Tests', () => {
    it('should parse a comprehensive fantasy-themed single-schema database with many foreign key relationships', async () => {
        // This test simulates a complex single-schema database similar to real-world scenarios
        // It tests the fix for parsing ALTER TABLE ADD CONSTRAINT statements without schema prefixes
        const sql = `
-- =============================================
-- Enchanted Kingdom Management System
-- A comprehensive fantasy database using single schema (dbo)
-- =============================================

-- =============================================
-- Core Kingdom Tables
-- =============================================

CREATE TABLE [Kingdoms] (
    [KingdomID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [KingdomName] NVARCHAR(100) NOT NULL UNIQUE,
    [FoundedYear] INT NOT NULL,
    [CurrentRuler] NVARCHAR(100) NOT NULL,
    [TreasuryGold] DECIMAL(18, 2) DEFAULT 100000.00,
    [Population] BIGINT DEFAULT 0,
    [MilitaryStrength] INT DEFAULT 100
);

CREATE TABLE [Regions] (
    [RegionID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [RegionName] NVARCHAR(100) NOT NULL,
    [KingdomID] BIGINT NOT NULL,
    [Terrain] NVARCHAR(50), -- 'Mountains', 'Forest', 'Plains', 'Desert', 'Swamp'
    [Population] INT DEFAULT 0,
    [TaxRate] DECIMAL(5, 2) DEFAULT 10.00
);

CREATE TABLE [Cities] (
    [CityID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CityName] NVARCHAR(100) NOT NULL,
    [RegionID] BIGINT NOT NULL,
    [Population] INT DEFAULT 1000,
    [HasWalls] BIT DEFAULT 0,
    [HasMarket] BIT DEFAULT 1,
    [DefenseRating] INT DEFAULT 5
);

CREATE TABLE [Castles] (
    [CastleID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CastleName] NVARCHAR(100) NOT NULL,
    [CityID] BIGINT NOT NULL,
    [GarrisonSize] INT DEFAULT 50,
    [TowerCount] INT DEFAULT 4,
    [MoatDepth] DECIMAL(5, 2) DEFAULT 3.00
);

-- =============================================
-- Character Management Tables
-- =============================================

CREATE TABLE [CharacterClasses] (
    [ClassID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ClassName] NVARCHAR(50) NOT NULL UNIQUE,
    [ClassType] NVARCHAR(30), -- 'Warrior', 'Mage', 'Rogue', 'Cleric'
    [BaseHealth] INT DEFAULT 100,
    [BaseMana] INT DEFAULT 50,
    [BaseStrength] INT DEFAULT 10,
    [BaseIntelligence] INT DEFAULT 10
);

CREATE TABLE [Characters] (
    [CharacterID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CharacterName] NVARCHAR(100) NOT NULL,
    [ClassID] BIGINT NOT NULL,
    [Level] INT DEFAULT 1,
    [Experience] BIGINT DEFAULT 0,
    [CurrentHealth] INT DEFAULT 100,
    [CurrentMana] INT DEFAULT 50,
    [HomeCityID] BIGINT NOT NULL,
    [Gold] DECIMAL(10, 2) DEFAULT 100.00,
    [CreatedDate] DATE NOT NULL
);

CREATE TABLE [CharacterSkills] (
    [SkillID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [SkillName] NVARCHAR(100) NOT NULL,
    [RequiredClassID] BIGINT NULL,
    [RequiredLevel] INT DEFAULT 1,
    [ManaCost] INT DEFAULT 10,
    [Cooldown] INT DEFAULT 0,
    [Damage] INT DEFAULT 0,
    [Description] NVARCHAR(MAX)
);

CREATE TABLE [CharacterSkillMapping] (
    [MappingID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CharacterID] BIGINT NOT NULL,
    [SkillID] BIGINT NOT NULL,
    [SkillLevel] INT DEFAULT 1,
    [LastUsed] DATETIME NULL
);

-- =============================================
-- Guild System Tables
-- =============================================

CREATE TABLE [GuildTypes] (
    [GuildTypeID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [TypeName] NVARCHAR(50) NOT NULL UNIQUE,
    [Description] NVARCHAR(255)
);

CREATE TABLE [Guilds] (
    [GuildID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [GuildName] NVARCHAR(100) NOT NULL UNIQUE,
    [GuildTypeID] BIGINT NOT NULL,
    [HeadquartersCityID] BIGINT NOT NULL,
    [FoundedDate] DATE NOT NULL,
    [GuildMasterID] BIGINT NULL,
    [MemberCount] INT DEFAULT 0,
    [GuildBank] DECIMAL(18, 2) DEFAULT 0.00,
    [Reputation] INT DEFAULT 50
);

CREATE TABLE [GuildMembers] (
    [MembershipID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [GuildID] BIGINT NOT NULL,
    [CharacterID] BIGINT NOT NULL,
    [JoinDate] DATE NOT NULL,
    [Rank] NVARCHAR(50) DEFAULT 'Member',
    [ContributionPoints] INT DEFAULT 0
);

CREATE TABLE [GuildQuests] (
    [QuestID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [QuestName] NVARCHAR(200) NOT NULL,
    [GuildID] BIGINT NOT NULL,
    [RequiredLevel] INT DEFAULT 1,
    [RewardGold] DECIMAL(10, 2) DEFAULT 100.00,
    [RewardExperience] INT DEFAULT 100,
    [QuestGiverID] BIGINT NULL,
    [Status] NVARCHAR(20) DEFAULT 'Available'
);

-- =============================================
-- Item and Inventory Tables
-- =============================================

CREATE TABLE [ItemCategories] (
    [CategoryID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CategoryName] NVARCHAR(50) NOT NULL UNIQUE,
    [Description] NVARCHAR(255)
);

CREATE TABLE [Items] (
    [ItemID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ItemName] NVARCHAR(150) NOT NULL,
    [CategoryID] BIGINT NOT NULL,
    [Rarity] NVARCHAR(20), -- 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'
    [BaseValue] DECIMAL(10, 2) DEFAULT 1.00,
    [Weight] DECIMAL(5, 2) DEFAULT 1.00,
    [Stackable] BIT DEFAULT 1,
    [MaxStack] INT DEFAULT 99,
    [RequiredLevel] INT DEFAULT 1,
    [RequiredClassID] BIGINT NULL
);

CREATE TABLE [Weapons] (
    [WeaponID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ItemID] BIGINT NOT NULL UNIQUE,
    [WeaponType] NVARCHAR(50), -- 'Sword', 'Axe', 'Bow', 'Staff', 'Dagger'
    [MinDamage] INT DEFAULT 1,
    [MaxDamage] INT DEFAULT 10,
    [AttackSpeed] DECIMAL(3, 2) DEFAULT 1.00,
    [Durability] INT DEFAULT 100,
    [EnchantmentSlots] INT DEFAULT 0
);

CREATE TABLE [Armor] (
    [ArmorID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ItemID] BIGINT NOT NULL UNIQUE,
    [ArmorType] NVARCHAR(50), -- 'Helmet', 'Chest', 'Legs', 'Boots', 'Gloves'
    [DefenseValue] INT DEFAULT 1,
    [MagicResistance] INT DEFAULT 0,
    [Durability] INT DEFAULT 100,
    [SetBonusID] BIGINT NULL
);

CREATE TABLE [CharacterInventory] (
    [InventoryID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CharacterID] BIGINT NOT NULL,
    [ItemID] BIGINT NOT NULL,
    [Quantity] INT DEFAULT 1,
    [IsEquipped] BIT DEFAULT 0,
    [SlotPosition] INT NULL,
    [AcquiredDate] DATETIME NOT NULL
);

-- =============================================
-- Magic System Tables
-- =============================================

CREATE TABLE [MagicSchools] (
    [SchoolID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [SchoolName] NVARCHAR(50) NOT NULL UNIQUE,
    [Element] NVARCHAR(30), -- 'Fire', 'Water', 'Earth', 'Air', 'Light', 'Dark'
    [Description] NVARCHAR(MAX)
);

CREATE TABLE [Spells] (
    [SpellID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [SpellName] NVARCHAR(100) NOT NULL,
    [SchoolID] BIGINT NOT NULL,
    [SpellLevel] INT DEFAULT 1,
    [ManaCost] INT DEFAULT 10,
    [CastTime] DECIMAL(3, 1) DEFAULT 1.0,
    [Range] INT DEFAULT 10,
    [AreaOfEffect] INT DEFAULT 0,
    [BaseDamage] INT DEFAULT 0,
    [Description] NVARCHAR(MAX)
);

CREATE TABLE [SpellBooks] (
    [SpellBookID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CharacterID] BIGINT NOT NULL,
    [SpellID] BIGINT NOT NULL,
    [DateLearned] DATE NOT NULL,
    [MasteryLevel] INT DEFAULT 1,
    [TimesUsed] INT DEFAULT 0
);

CREATE TABLE [Enchantments] (
    [EnchantmentID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [EnchantmentName] NVARCHAR(100) NOT NULL,
    [RequiredSpellID] BIGINT NULL,
    [BonusType] NVARCHAR(50), -- 'Damage', 'Defense', 'Speed', 'Magic'
    [BonusValue] INT DEFAULT 1,
    [Duration] INT NULL, -- NULL for permanent
    [Cost] DECIMAL(10, 2) DEFAULT 100.00
);

CREATE TABLE [ItemEnchantments] (
    [ItemEnchantmentID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [ItemID] BIGINT NOT NULL,
    [EnchantmentID] BIGINT NOT NULL,
    [AppliedByCharacterID] BIGINT NOT NULL,
    [AppliedDate] DATETIME NOT NULL,
    [ExpiryDate] DATETIME NULL
);

-- =============================================
-- Quest and Achievement Tables
-- =============================================

CREATE TABLE [QuestLines] (
    [QuestLineID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [QuestLineName] NVARCHAR(200) NOT NULL,
    [MinLevel] INT DEFAULT 1,
    [MaxLevel] INT DEFAULT 100,
    [TotalQuests] INT DEFAULT 1,
    [FinalRewardItemID] BIGINT NULL
);

CREATE TABLE [Quests] (
    [QuestID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [QuestName] NVARCHAR(200) NOT NULL,
    [QuestLineID] BIGINT NULL,
    [QuestGiverNPCID] BIGINT NULL,
    [RequiredLevel] INT DEFAULT 1,
    [RequiredQuestID] BIGINT NULL, -- Prerequisite quest
    [ObjectiveType] NVARCHAR(50), -- 'Kill', 'Collect', 'Deliver', 'Explore'
    [ObjectiveCount] INT DEFAULT 1,
    [RewardGold] DECIMAL(10, 2) DEFAULT 10.00,
    [RewardExperience] INT DEFAULT 100,
    [RewardItemID] BIGINT NULL
);

CREATE TABLE [CharacterQuests] (
    [CharacterQuestID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CharacterID] BIGINT NOT NULL,
    [QuestID] BIGINT NOT NULL,
    [StartDate] DATETIME NOT NULL,
    [CompletedDate] DATETIME NULL,
    [CurrentProgress] INT DEFAULT 0,
    [Status] NVARCHAR(20) DEFAULT 'Active' -- 'Active', 'Completed', 'Failed', 'Abandoned'
);

CREATE TABLE [Achievements] (
    [AchievementID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [AchievementName] NVARCHAR(100) NOT NULL,
    [Description] NVARCHAR(500),
    [Points] INT DEFAULT 10,
    [Category] NVARCHAR(50),
    [RequiredCount] INT DEFAULT 1,
    [RewardTitle] NVARCHAR(100) NULL
);

CREATE TABLE [CharacterAchievements] (
    [CharacterAchievementID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CharacterID] BIGINT NOT NULL,
    [AchievementID] BIGINT NOT NULL,
    [EarnedDate] DATETIME NOT NULL,
    [Progress] INT DEFAULT 0
);

-- =============================================
-- NPC and Monster Tables
-- =============================================

CREATE TABLE [NPCTypes] (
    [NPCTypeID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [TypeName] NVARCHAR(50) NOT NULL UNIQUE,
    [IsFriendly] BIT DEFAULT 1,
    [CanTrade] BIT DEFAULT 0,
    [CanGiveQuests] BIT DEFAULT 0
);

CREATE TABLE [NPCs] (
    [NPCID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [NPCName] NVARCHAR(100) NOT NULL,
    [NPCTypeID] BIGINT NOT NULL,
    [LocationCityID] BIGINT NOT NULL,
    [Health] INT DEFAULT 100,
    [Level] INT DEFAULT 1,
    [DialogueText] NVARCHAR(MAX),
    [RespawnTime] INT DEFAULT 300 -- seconds
);

CREATE TABLE [Monsters] (
    [MonsterID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [MonsterName] NVARCHAR(100) NOT NULL,
    [MonsterType] NVARCHAR(50), -- 'Beast', 'Undead', 'Dragon', 'Elemental', 'Demon'
    [Level] INT DEFAULT 1,
    [Health] INT DEFAULT 100,
    [Damage] INT DEFAULT 10,
    [Defense] INT DEFAULT 5,
    [ExperienceReward] INT DEFAULT 50,
    [GoldDrop] DECIMAL(10, 2) DEFAULT 5.00,
    [SpawnRegionID] BIGINT NULL
);

CREATE TABLE [MonsterLoot] (
    [LootID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [MonsterID] BIGINT NOT NULL,
    [ItemID] BIGINT NOT NULL,
    [DropChance] DECIMAL(5, 2) DEFAULT 10.00, -- percentage
    [MinQuantity] INT DEFAULT 1,
    [MaxQuantity] INT DEFAULT 1
);

-- =============================================
-- Combat and PvP Tables
-- =============================================

CREATE TABLE [BattleTypes] (
    [BattleTypeID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [TypeName] NVARCHAR(50) NOT NULL UNIQUE,
    [MinParticipants] INT DEFAULT 2,
    [MaxParticipants] INT DEFAULT 2,
    [AllowTeams] BIT DEFAULT 0
);

CREATE TABLE [Battles] (
    [BattleID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [BattleTypeID] BIGINT NOT NULL,
    [StartTime] DATETIME NOT NULL,
    [EndTime] DATETIME NULL,
    [LocationCityID] BIGINT NOT NULL,
    [WinnerCharacterID] BIGINT NULL,
    [TotalDamageDealt] BIGINT DEFAULT 0
);

CREATE TABLE [BattleParticipants] (
    [ParticipantID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [BattleID] BIGINT NOT NULL,
    [CharacterID] BIGINT NOT NULL,
    [TeamNumber] INT DEFAULT 0,
    [DamageDealt] INT DEFAULT 0,
    [DamageTaken] INT DEFAULT 0,
    [HealingDone] INT DEFAULT 0,
    [KillCount] INT DEFAULT 0,
    [DeathCount] INT DEFAULT 0,
    [FinalPlacement] INT NULL
);

-- =============================================
-- Economy Tables
-- =============================================

CREATE TABLE [Currencies] (
    [CurrencyID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [CurrencyName] NVARCHAR(50) NOT NULL UNIQUE,
    [ExchangeRate] DECIMAL(10, 4) DEFAULT 1.0000, -- relative to gold
    [IssuingKingdomID] BIGINT NOT NULL
);

CREATE TABLE [MarketListings] (
    [ListingID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [SellerCharacterID] BIGINT NOT NULL,
    [ItemID] BIGINT NOT NULL,
    [Quantity] INT DEFAULT 1,
    [PricePerUnit] DECIMAL(10, 2) NOT NULL,
    [CurrencyID] BIGINT NOT NULL,
    [ListedDate] DATETIME NOT NULL,
    [ExpiryDate] DATETIME NOT NULL,
    [Status] NVARCHAR(20) DEFAULT 'Active'
);

CREATE TABLE [Transactions] (
    [TransactionID] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [BuyerCharacterID] BIGINT NOT NULL,
    [SellerCharacterID] BIGINT NOT NULL,
    [ItemID] BIGINT NOT NULL,
    [Quantity] INT DEFAULT 1,
    [TotalPrice] DECIMAL(10, 2) NOT NULL,
    [CurrencyID] BIGINT NOT NULL,
    [TransactionDate] DATETIME NOT NULL
);

-- =============================================
-- Foreign Key Constraints (Without Schema Prefix)
-- Testing the fix for single-schema foreign key parsing
-- =============================================

-- Kingdom Relationships
ALTER TABLE [Regions] ADD CONSTRAINT [FK_Regions_Kingdoms] 
    FOREIGN KEY ([KingdomID]) REFERENCES [Kingdoms]([KingdomID]);

ALTER TABLE [Cities] ADD CONSTRAINT [FK_Cities_Regions] 
    FOREIGN KEY ([RegionID]) REFERENCES [Regions]([RegionID]);

ALTER TABLE [Castles] ADD CONSTRAINT [FK_Castles_Cities] 
    FOREIGN KEY ([CityID]) REFERENCES [Cities]([CityID]);

-- Character Relationships
ALTER TABLE [Characters] ADD CONSTRAINT [FK_Characters_Classes] 
    FOREIGN KEY ([ClassID]) REFERENCES [CharacterClasses]([ClassID]);

ALTER TABLE [Characters] ADD CONSTRAINT [FK_Characters_Cities] 
    FOREIGN KEY ([HomeCityID]) REFERENCES [Cities]([CityID]);

ALTER TABLE [CharacterSkills] ADD CONSTRAINT [FK_CharacterSkills_Classes] 
    FOREIGN KEY ([RequiredClassID]) REFERENCES [CharacterClasses]([ClassID]);

ALTER TABLE [CharacterSkillMapping] ADD CONSTRAINT [FK_SkillMapping_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [CharacterSkillMapping] ADD CONSTRAINT [FK_SkillMapping_Skills] 
    FOREIGN KEY ([SkillID]) REFERENCES [CharacterSkills]([SkillID]);

-- Guild Relationships
ALTER TABLE [Guilds] ADD CONSTRAINT [FK_Guilds_GuildTypes] 
    FOREIGN KEY ([GuildTypeID]) REFERENCES [GuildTypes]([GuildTypeID]);

ALTER TABLE [Guilds] ADD CONSTRAINT [FK_Guilds_Cities] 
    FOREIGN KEY ([HeadquartersCityID]) REFERENCES [Cities]([CityID]);

ALTER TABLE [Guilds] ADD CONSTRAINT [FK_Guilds_GuildMaster] 
    FOREIGN KEY ([GuildMasterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [GuildMembers] ADD CONSTRAINT [FK_GuildMembers_Guilds] 
    FOREIGN KEY ([GuildID]) REFERENCES [Guilds]([GuildID]);

ALTER TABLE [GuildMembers] ADD CONSTRAINT [FK_GuildMembers_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [GuildQuests] ADD CONSTRAINT [FK_GuildQuests_Guilds] 
    FOREIGN KEY ([GuildID]) REFERENCES [Guilds]([GuildID]);

ALTER TABLE [GuildQuests] ADD CONSTRAINT [FK_GuildQuests_QuestGiver] 
    FOREIGN KEY ([QuestGiverID]) REFERENCES [NPCs]([NPCID]);

-- Item Relationships
ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_Categories] 
    FOREIGN KEY ([CategoryID]) REFERENCES [ItemCategories]([CategoryID]);

ALTER TABLE [Items] ADD CONSTRAINT [FK_Items_RequiredClass] 
    FOREIGN KEY ([RequiredClassID]) REFERENCES [CharacterClasses]([ClassID]);

ALTER TABLE [Weapons] ADD CONSTRAINT [FK_Weapons_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [Armor] ADD CONSTRAINT [FK_Armor_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [CharacterInventory] ADD CONSTRAINT [FK_Inventory_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [CharacterInventory] ADD CONSTRAINT [FK_Inventory_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

-- Magic Relationships
ALTER TABLE [Spells] ADD CONSTRAINT [FK_Spells_Schools] 
    FOREIGN KEY ([SchoolID]) REFERENCES [MagicSchools]([SchoolID]);

ALTER TABLE [SpellBooks] ADD CONSTRAINT [FK_SpellBooks_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [SpellBooks] ADD CONSTRAINT [FK_SpellBooks_Spells] 
    FOREIGN KEY ([SpellID]) REFERENCES [Spells]([SpellID]);

ALTER TABLE [Enchantments] ADD CONSTRAINT [FK_Enchantments_Spells] 
    FOREIGN KEY ([RequiredSpellID]) REFERENCES [Spells]([SpellID]);

ALTER TABLE [ItemEnchantments] ADD CONSTRAINT [FK_ItemEnchantments_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [ItemEnchantments] ADD CONSTRAINT [FK_ItemEnchantments_Enchantments] 
    FOREIGN KEY ([EnchantmentID]) REFERENCES [Enchantments]([EnchantmentID]);

ALTER TABLE [ItemEnchantments] ADD CONSTRAINT [FK_ItemEnchantments_Characters] 
    FOREIGN KEY ([AppliedByCharacterID]) REFERENCES [Characters]([CharacterID]);

-- Quest Relationships
ALTER TABLE [QuestLines] ADD CONSTRAINT [FK_QuestLines_FinalReward] 
    FOREIGN KEY ([FinalRewardItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [Quests] ADD CONSTRAINT [FK_Quests_QuestLines] 
    FOREIGN KEY ([QuestLineID]) REFERENCES [QuestLines]([QuestLineID]);

ALTER TABLE [Quests] ADD CONSTRAINT [FK_Quests_QuestGiver] 
    FOREIGN KEY ([QuestGiverNPCID]) REFERENCES [NPCs]([NPCID]);

ALTER TABLE [Quests] ADD CONSTRAINT [FK_Quests_Prerequisites] 
    FOREIGN KEY ([RequiredQuestID]) REFERENCES [Quests]([QuestID]);

ALTER TABLE [Quests] ADD CONSTRAINT [FK_Quests_RewardItem] 
    FOREIGN KEY ([RewardItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [CharacterQuests] ADD CONSTRAINT [FK_CharacterQuests_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [CharacterQuests] ADD CONSTRAINT [FK_CharacterQuests_Quests] 
    FOREIGN KEY ([QuestID]) REFERENCES [Quests]([QuestID]);

ALTER TABLE [CharacterAchievements] ADD CONSTRAINT [FK_CharAchievements_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [CharacterAchievements] ADD CONSTRAINT [FK_CharAchievements_Achievements] 
    FOREIGN KEY ([AchievementID]) REFERENCES [Achievements]([AchievementID]);

-- NPC and Monster Relationships
ALTER TABLE [NPCs] ADD CONSTRAINT [FK_NPCs_Types] 
    FOREIGN KEY ([NPCTypeID]) REFERENCES [NPCTypes]([NPCTypeID]);

ALTER TABLE [NPCs] ADD CONSTRAINT [FK_NPCs_Cities] 
    FOREIGN KEY ([LocationCityID]) REFERENCES [Cities]([CityID]);

ALTER TABLE [Monsters] ADD CONSTRAINT [FK_Monsters_Regions] 
    FOREIGN KEY ([SpawnRegionID]) REFERENCES [Regions]([RegionID]);

ALTER TABLE [MonsterLoot] ADD CONSTRAINT [FK_MonsterLoot_Monsters] 
    FOREIGN KEY ([MonsterID]) REFERENCES [Monsters]([MonsterID]);

ALTER TABLE [MonsterLoot] ADD CONSTRAINT [FK_MonsterLoot_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

-- Battle Relationships
ALTER TABLE [Battles] ADD CONSTRAINT [FK_Battles_Types] 
    FOREIGN KEY ([BattleTypeID]) REFERENCES [BattleTypes]([BattleTypeID]);

ALTER TABLE [Battles] ADD CONSTRAINT [FK_Battles_Cities] 
    FOREIGN KEY ([LocationCityID]) REFERENCES [Cities]([CityID]);

ALTER TABLE [Battles] ADD CONSTRAINT [FK_Battles_Winner] 
    FOREIGN KEY ([WinnerCharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [BattleParticipants] ADD CONSTRAINT [FK_BattleParticipants_Battles] 
    FOREIGN KEY ([BattleID]) REFERENCES [Battles]([BattleID]);

ALTER TABLE [BattleParticipants] ADD CONSTRAINT [FK_BattleParticipants_Characters] 
    FOREIGN KEY ([CharacterID]) REFERENCES [Characters]([CharacterID]);

-- Economy Relationships
ALTER TABLE [Currencies] ADD CONSTRAINT [FK_Currencies_Kingdoms] 
    FOREIGN KEY ([IssuingKingdomID]) REFERENCES [Kingdoms]([KingdomID]);

ALTER TABLE [MarketListings] ADD CONSTRAINT [FK_MarketListings_Seller] 
    FOREIGN KEY ([SellerCharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [MarketListings] ADD CONSTRAINT [FK_MarketListings_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [MarketListings] ADD CONSTRAINT [FK_MarketListings_Currency] 
    FOREIGN KEY ([CurrencyID]) REFERENCES [Currencies]([CurrencyID]);

ALTER TABLE [Transactions] ADD CONSTRAINT [FK_Transactions_Buyer] 
    FOREIGN KEY ([BuyerCharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [Transactions] ADD CONSTRAINT [FK_Transactions_Seller] 
    FOREIGN KEY ([SellerCharacterID]) REFERENCES [Characters]([CharacterID]);

ALTER TABLE [Transactions] ADD CONSTRAINT [FK_Transactions_Items] 
    FOREIGN KEY ([ItemID]) REFERENCES [Items]([ItemID]);

ALTER TABLE [Transactions] ADD CONSTRAINT [FK_Transactions_Currency] 
    FOREIGN KEY ([CurrencyID]) REFERENCES [Currencies]([CurrencyID]);
        `;

        const result = await fromSQLServer(sql);

        // Verify correct number of tables
        expect(result.tables.length).toBe(37); // Actually 37 tables after counting

        // Verify all tables use default 'dbo' schema
        const schemas = new Set(result.tables.map((t) => t.schema));
        expect(schemas.size).toBe(1);
        expect(schemas.has('dbo')).toBe(true);

        // Verify correct number of relationships
        expect(result.relationships.length).toBe(55); // 55 foreign key relationships that can be parsed

        // Verify all relationships have valid source and target table IDs
        const validRelationships = result.relationships.filter(
            (r) => r.sourceTableId && r.targetTableId
        );
        expect(validRelationships.length).toBe(result.relationships.length);

        // Check specific table names exist
        const tableNames = result.tables.map((t) => t.name);
        expect(tableNames).toContain('Kingdoms');
        expect(tableNames).toContain('Characters');
        expect(tableNames).toContain('Guilds');
        expect(tableNames).toContain('Items');
        expect(tableNames).toContain('Spells');
        expect(tableNames).toContain('Quests');
        expect(tableNames).toContain('Battles');
        expect(tableNames).toContain('Monsters');

        // Verify some specific relationships exist and are properly linked
        const characterToClass = result.relationships.find(
            (r) => r.name === 'FK_Characters_Classes'
        );
        expect(characterToClass).toBeDefined();
        expect(characterToClass?.sourceTable).toBe('Characters');
        expect(characterToClass?.targetTable).toBe('CharacterClasses');
        expect(characterToClass?.sourceColumn).toBe('ClassID');
        expect(characterToClass?.targetColumn).toBe('ClassID');

        const guildsToCity = result.relationships.find(
            (r) => r.name === 'FK_Guilds_Cities'
        );
        expect(guildsToCity).toBeDefined();
        expect(guildsToCity?.sourceTable).toBe('Guilds');
        expect(guildsToCity?.targetTable).toBe('Cities');

        const inventoryToItems = result.relationships.find(
            (r) => r.name === 'FK_Inventory_Items'
        );
        expect(inventoryToItems).toBeDefined();
        expect(inventoryToItems?.sourceTable).toBe('CharacterInventory');
        expect(inventoryToItems?.targetTable).toBe('Items');

        // Check self-referencing relationship
        const questPrerequisite = result.relationships.find(
            (r) => r.name === 'FK_Quests_Prerequisites'
        );
        expect(questPrerequisite).toBeDefined();
        expect(questPrerequisite?.sourceTable).toBe('Quests');
        expect(questPrerequisite?.targetTable).toBe('Quests');

        // Verify table IDs are correctly linked in relationships
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
    });
});
