import { describe, it, expect } from 'vitest';
import { fromSQLServer } from '../sqlserver';

describe('SQL Server Fantasy Database Import Tests', () => {
    it('should parse the magical realm database correctly', async () => {
        // Fantasy-themed SQL Server database with multiple schemas
        const sql = `
            USE [MagicalRealmDB]
            GO
            /****** Object:  Schema [spellcasting]    Script Date: 25.7.2025. 9:42:07 ******/
            CREATE SCHEMA [spellcasting]
            GO
            /****** Object:  Schema [enchantments]    Script Date: 25.7.2025. 9:42:07 ******/
            CREATE SCHEMA [enchantments]
            GO
            /****** Object:  Schema [artifacts]    Script Date: 25.7.2025. 9:42:07 ******/
            CREATE SCHEMA [artifacts]
            GO
            /****** Object:  Schema [wizards]    Script Date: 25.7.2025. 9:42:07 ******/
            CREATE SCHEMA [wizards]
            GO
            
            /****** Object:  Table [spellcasting].[Spell]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [spellcasting].[Spell](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [RealmId] [uniqueidentifier] NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [DeletedById] [uniqueidentifier] NULL,
                [DeletedByFullName] [nvarchar](max) NULL,
                [DeletedByEmail] [nvarchar](max) NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [UpdatedBy] [uniqueidentifier] NULL,
                [UpdatedAt] [datetime2](7) NULL,
                [PowerLevel] [decimal](18, 2) NOT NULL,
                [Incantation] [nvarchar](max) NULL,
                [ParentId] [uniqueidentifier] NULL,
                [Name] [nvarchar](255) NOT NULL,
                [Description] [nvarchar](max) NOT NULL,
                [RunicInscription] [varchar](max) NULL,
                CONSTRAINT [PK_Spell] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [spellcasting].[SpellCasting]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [spellcasting].[SpellCasting](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [RealmId] [uniqueidentifier] NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [DeletedById] [uniqueidentifier] NULL,
                [DeletedByFullName] [nvarchar](max) NULL,
                [DeletedByEmail] [nvarchar](max) NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [UpdatedBy] [uniqueidentifier] NULL,
                [UpdatedAt] [datetime2](7) NULL,
                [WizardLevel] [int] NOT NULL,
                [ManaCost] [decimal](18, 2) NOT NULL,
                [CastingTime] [decimal](18, 2) NULL,
                [Components] [nvarchar](max) NULL,
                [CastingNumber] [int] NULL,
                [SuccessRate] [decimal](18, 2) NULL,
                [CriticalChance] [decimal](18, 2) NULL,
                [ExtendedDuration] [decimal](18, 2) NULL,
                [Status] [int] NULL,
                [SpellId] [uniqueidentifier] NOT NULL,
                [CastingNotes] [nvarchar](max) NULL,
                [ParentId] [uniqueidentifier] NULL,
                CONSTRAINT [PK_SpellCasting] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [enchantments].[MagicalItem]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [enchantments].[MagicalItem](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [WandId] [uniqueidentifier] NOT NULL,
                [EnchanterId] [uniqueidentifier] NOT NULL,
                [OrderNumber] [nvarchar](max) NOT NULL,
                [EnchantmentDate] [datetime2](7) NOT NULL,
                [IsCertified] [bit] NOT NULL,
                [CertificationCode] [nvarchar](max) NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [DeletedById] [uniqueidentifier] NULL,
                [DeletedByFullName] [nvarchar](max) NULL,
                [DeletedByEmail] [nvarchar](max) NULL,
                [ParentId] [uniqueidentifier] NULL,
                [ReasonForAction] [nvarchar](max) NULL,
                [EnchantmentLevel] [int] NOT NULL,
                CONSTRAINT [PK_MagicalItem] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [enchantments].[EnchantmentFormula]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [enchantments].[EnchantmentFormula](
                [Id] [uniqueidentifier] NOT NULL,
                [RealmId] [uniqueidentifier] NOT NULL,
                [ParentId] [uniqueidentifier] NULL,
                [DeletedAt] [datetime2](7) NULL,
                [DeletedById] [uniqueidentifier] NULL,
                [DeletedByFullName] [nvarchar](max) NULL,
                [DeletedByEmail] [nvarchar](max) NULL,
                [ReasonForAction] [nvarchar](max) NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [FormulaTypeId] [int] NOT NULL,
                [Definition] [nvarchar](max) NOT NULL,
                [Name] [nvarchar](max) NOT NULL,
                [HasMultipleApplications] [bit] NOT NULL,
                [StepNumber] [int] NOT NULL,
                [Identifier] [int] NOT NULL,
                CONSTRAINT [PK_EnchantmentFormula] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [wizards].[Wizard]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [wizards].[Wizard](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [DeletedAt] [datetime2](7) NULL,
                [DeletedByEmail] [nvarchar](max) NULL,
                [DeletedByFullName] [nvarchar](max) NULL,
                [DeletedById] [uniqueidentifier] NULL,
                [ParentId] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [Name] [nvarchar](255) NOT NULL,
                [Title] [nvarchar](255) NULL,
                [Biography] [nvarchar](max) NULL,
                [SpecialtySchool] [nvarchar](100) NULL,
                [PowerLevel] [int] NOT NULL,
                [JoinedGuildDate] [datetime2](7) NOT NULL,
                [IsActive] [bit] NOT NULL,
                [MagicalSignature] [nvarchar](max) NOT NULL,
                [TowerId] [uniqueidentifier] NOT NULL,
                [MentorId] [uniqueidentifier] NULL,
                [SpellbookNotes] [varchar](max) NULL,
                CONSTRAINT [PK_Wizard] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                CONSTRAINT [AK_Wizard_HelpId] UNIQUE NONCLUSTERED 
                (
                    [HelpId] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [wizards].[WizardSpellbook]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [wizards].[WizardSpellbook](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [DeletedByEmail] [nvarchar](max) NULL,
                [DeletedByFullName] [nvarchar](max) NULL,
                [DeletedById] [uniqueidentifier] NULL,
                [SuccessRate] [decimal](18, 2) NOT NULL,
                [ManaCostReduction] [decimal](18, 2) NOT NULL,
                [CriticalBonus] [decimal](18, 2) NOT NULL,
                [PageNumber] [int] NOT NULL,
                [WizardId] [uniqueidentifier] NOT NULL,
                [TowerId] [uniqueidentifier] NOT NULL,
                [ParentId] [uniqueidentifier] NULL,
                [ReasonForAction] [nvarchar](max) NULL,
                [SpellId] [uniqueidentifier] NOT NULL,
                [EnchanterId] [uniqueidentifier] NOT NULL,
                [OrderNumber] [nvarchar](max) NOT NULL,
                [LearnedDate] [datetime2](7) NOT NULL,
                [IsMastered] [bit] NOT NULL,
                [MasteryCertificate] [nvarchar](max) NOT NULL,
                CONSTRAINT [PK_WizardSpellbook] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [artifacts].[MagicSchool]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [artifacts].[MagicSchool](
                [Id] [int] IDENTITY(1,1) NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [Value] [nvarchar](max) NOT NULL,
                CONSTRAINT [PK_MagicSchool] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [artifacts].[ArtifactType]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [artifacts].[ArtifactType](
                [Id] [int] IDENTITY(1,1) NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [Name] [nvarchar](max) NOT NULL,
                [Key] [nvarchar](max) NOT NULL,
                [ItemCategoryId] [int] NOT NULL,
                CONSTRAINT [PK_ArtifactType] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [artifacts].[AncientRelic]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [artifacts].[AncientRelic](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [DiscoveryDate] [datetime2](7) NULL,
                [VaultId] [uniqueidentifier] NULL,
                [AppraiserId] [uniqueidentifier] NULL,
                [NumberOfRunes] [int] NULL,
                [MagicalAura] [decimal](18, 2) NULL,
                [AuraReadingDeviceId] [uniqueidentifier] NULL,
                [PowerOutput] [decimal](18, 2) NULL,
                [PowerGaugeTypeId] [int] NULL,
                [AgeInCenturies] [decimal](18, 2) NULL,
                [CarbonDatingDeviceId] [uniqueidentifier] NULL,
                [HistoricalEra] [nvarchar](max) NULL,
                [EraVerificationMethod] [int] NULL,
                [Curse] [nvarchar](max) NULL,
                [CurseDetectorId] [uniqueidentifier] NULL,
                [CurseStrength] [decimal](18, 2) NULL,
                [ProtectionLevel] [int] NULL,
                [MagicalResonance] [decimal](18, 2) NULL,
                [ResonanceWithAdjustment] [decimal](18, 2) NULL,
                [AuthenticityVerified] [bit] NOT NULL,
                [VerificationWizardId] [uniqueidentifier] NULL,
                [RestorationNeeded] [bit] NOT NULL,
                [RestorationCost] [decimal](18, 2) NULL,
                [EstimatedValue] [decimal](18, 2) NULL,
                [MarketDemand] [decimal](18, 2) NULL,
                [ArtifactCatalogId] [uniqueidentifier] NULL,
                [OriginRealm] [nvarchar](max) NULL,
                [CreatorWizard] [nvarchar](max) NULL,
                [LegendaryStatus] [bit] NOT NULL,
                [ParentId] [uniqueidentifier] NULL,
                [IsSealed] [bit] NOT NULL,
                CONSTRAINT [PK_AncientRelic] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                CONSTRAINT [AK_AncientRelic_HelpId] UNIQUE NONCLUSTERED 
                (
                    [HelpId] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
            
            /****** Object:  Table [artifacts].[RelicPowerMeasurements]    Script Date: 25.7.2025. 9:42:07 ******/
            SET ANSI_NULLS ON
            GO
            SET QUOTED_IDENTIFIER ON
            GO
            CREATE TABLE [artifacts].[RelicPowerMeasurements](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [ParentId] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [MagicalEnergyMeasured] [decimal](31, 15) NOT NULL,
                [AuraIntensityMeasured] [decimal](31, 15) NOT NULL,
                [ResonanceFrequencyMeasured] [decimal](31, 15) NOT NULL,
                [DimensionalFluxMeasured] [decimal](31, 15) NOT NULL,
                [MagicalEnergyCorrection] [decimal](31, 15) NULL,
                [AuraIntensityCorrection] [decimal](31, 15) NULL,
                [ResonanceFrequencyCorrection] [decimal](31, 15) NULL,
                [DimensionalFluxCorrection] [decimal](31, 15) NULL,
                [MagicalEnergyCalculated] [decimal](31, 15) NULL,
                [AuraIntensityCalculated] [decimal](31, 15) NULL,
                [ResonanceFrequencyCalculated] [decimal](31, 15) NULL,
                [DimensionalFluxCalculated] [decimal](31, 15) NULL,
                [MagicalEnergyUncertainty] [decimal](31, 15) NULL,
                [AuraIntensityUncertainty] [decimal](31, 15) NULL,
                [ResonanceFrequencyUncertainty] [decimal](31, 15) NULL,
                [DimensionalFluxUncertainty] [decimal](31, 15) NULL,
                [MagicalEnergyDrift] [decimal](31, 15) NULL,
                [AuraIntensityDrift] [decimal](31, 15) NULL,
                [ResonanceFrequencyDrift] [decimal](31, 15) NULL,
                [DimensionalFluxDrift] [decimal](31, 15) NULL,
                [AncientRelicId] [uniqueidentifier] NULL,
                CONSTRAINT [PK_RelicPowerMeasurements] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            GO
        `;

        const result = await fromSQLServer(sql);

        // Get unique schemas from parsed tables
        const foundSchemas = [
            ...new Set(result.tables.map((t) => t.schema || 'dbo')),
        ];

        // Verify we found tables in multiple schemas
        expect(foundSchemas.length).toBeGreaterThan(1);
        expect(foundSchemas).toContain('spellcasting');
        expect(foundSchemas).toContain('enchantments');
        expect(foundSchemas).toContain('wizards');
        expect(foundSchemas).toContain('artifacts');

        // Check for some specific tables we know should exist
        expect(
            result.tables.some(
                (t) => t.name === 'Spell' && t.schema === 'spellcasting'
            )
        ).toBe(true);
        expect(
            result.tables.some(
                (t) => t.name === 'SpellCasting' && t.schema === 'spellcasting'
            )
        ).toBe(true);
        expect(
            result.tables.some(
                (t) => t.name === 'Wizard' && t.schema === 'wizards'
            )
        ).toBe(true);

        // Check data types are handled correctly
        const spellTable = result.tables.find(
            (t) => t.name === 'Spell' && t.schema === 'spellcasting'
        );
        expect(spellTable).toBeDefined();

        if (spellTable) {
            expect(spellTable.columns.find((c) => c.name === 'Id')?.type).toBe(
                'uniqueidentifier'
            );
            expect(
                spellTable.columns.find((c) => c.name === 'PowerLevel')?.type
            ).toBe('decimal');
            expect(
                spellTable.columns.find((c) => c.name === 'IsDeleted')?.type
            ).toBe('bit');
            expect(
                spellTable.columns.find((c) => c.name === 'CreatedAt')?.type
            ).toBe('datetime2');

            // Check nvarchar(max) fields
            const incantationField = spellTable.columns.find(
                (c) => c.name === 'Incantation'
            );
            expect(incantationField?.type).toBe('nvarchar');
            expect(incantationField?.typeArgs).toBe('max');

            // Check varchar(max) fields
            const runicField = spellTable.columns.find(
                (c) => c.name === 'RunicInscription'
            );
            expect(runicField?.type).toBe('varchar');
            expect(runicField?.typeArgs).toBe('max');
        }

        // Check IDENTITY columns
        const magicSchoolTable = result.tables.find(
            (t) => t.name === 'MagicSchool' && t.schema === 'artifacts'
        );
        expect(magicSchoolTable).toBeDefined();
        if (magicSchoolTable) {
            const idColumn = magicSchoolTable.columns.find(
                (c) => c.name === 'Id'
            );
            expect(idColumn?.increment).toBe(true);
            expect(idColumn?.type).toBe('int');
        }

        // Check unique constraints converted to indexes
        const wizardTable = result.tables.find(
            (t) => t.name === 'Wizard' && t.schema === 'wizards'
        );
        expect(wizardTable).toBeDefined();
        if (wizardTable) {
            expect(wizardTable.indexes).toHaveLength(1);
            expect(wizardTable.indexes[0].unique).toBe(true);
            expect(wizardTable.indexes[0].columns).toContain('HelpId');
            expect(wizardTable.indexes[0].name).toBe('AK_Wizard_HelpId');
        }
    });

    it('should handle ALTER TABLE ADD CONSTRAINT statements for magical artifacts', async () => {
        const sql = `
            CREATE TABLE [artifacts].[MagicalArtifact] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [Name] [nvarchar](255) NOT NULL,
                [PowerLevel] [int] NOT NULL
            );

            CREATE TABLE [enchantments].[ArtifactEnchantment] (
                [Id] [uniqueidentifier] NOT NULL PRIMARY KEY,
                [PrimaryArtifactId] [uniqueidentifier] NOT NULL,
                [SecondaryArtifactId] [uniqueidentifier] NOT NULL,
                [EnchantmentStrength] [decimal](18, 2) NOT NULL
            );

            ALTER TABLE [enchantments].[ArtifactEnchantment] 
                ADD CONSTRAINT [FK_ArtifactEnchantment_Primary] 
                FOREIGN KEY ([PrimaryArtifactId]) 
                REFERENCES [artifacts].[MagicalArtifact]([Id]);

            ALTER TABLE [enchantments].[ArtifactEnchantment] 
                ADD CONSTRAINT [FK_ArtifactEnchantment_Secondary] 
                FOREIGN KEY ([SecondaryArtifactId]) 
                REFERENCES [artifacts].[MagicalArtifact]([Id]);
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(2);

        // Check both foreign keys were parsed
        const primaryRel = result.relationships.find(
            (r) =>
                r.sourceColumn === 'PrimaryArtifactId' &&
                r.name === 'FK_ArtifactEnchantment_Primary'
        );
        expect(primaryRel).toBeDefined();
        expect(primaryRel?.sourceTable).toBe('ArtifactEnchantment');
        expect(primaryRel?.targetTable).toBe('MagicalArtifact');

        const secondaryRel = result.relationships.find(
            (r) =>
                r.sourceColumn === 'SecondaryArtifactId' &&
                r.name === 'FK_ArtifactEnchantment_Secondary'
        );
        expect(secondaryRel).toBeDefined();
        expect(secondaryRel?.sourceTable).toBe('ArtifactEnchantment');
        expect(secondaryRel?.targetTable).toBe('MagicalArtifact');
    });

    it('should handle tables with many columns including nvarchar(max)', async () => {
        const sql = `
            CREATE TABLE [wizards].[SpellResearchEnvironment](
                [Id] [uniqueidentifier] NOT NULL,
                [HelpId] [uniqueidentifier] NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [CreatedAt] [datetime2](7) NOT NULL,
                [CreatedById] [uniqueidentifier] NULL,
                [CreatedByUsername] [nvarchar](max) NOT NULL,
                [ResearchDate] [datetime2](7) NULL,
                [LaboratoryId] [uniqueidentifier] NULL,
                [EvaluationCriteriaId] [uniqueidentifier] NULL,
                [NumberOfExperiments] [int] NULL,
                [ManaLevelStart] [decimal](18, 2) NULL,
                [ManaGaugeId] [uniqueidentifier] NULL,
                [ManaLevelEnd] [decimal](18, 2) NULL,
                [ManaGaugeTypeId] [int] NULL,
                [AetherDensityStart] [decimal](18, 2) NULL,
                [AetherGaugeId] [uniqueidentifier] NULL,
                [AetherDensityEnd] [decimal](18, 2) NULL,
                [AetherGaugeTypeId] [int] NULL,
                [MagicalFieldStart] [decimal](18, 2) NULL,
                [MagicalFieldGaugeId] [uniqueidentifier] NULL,
                [MagicalFieldEnd] [decimal](18, 2) NULL,
                [MagicalFieldGaugeTypeId] [int] NULL,
                [MagicalFieldWithCorrection] [decimal](18, 2) NULL,
                [AetherDensityWithCorrection] [decimal](18, 2) NULL,
                [ElementalBalanceStart] [decimal](18, 2) NULL,
                [ElementalBalanceGaugeId] [uniqueidentifier] NULL,
                [ElementalBalanceEnd] [decimal](18, 2) NULL,
                [ElementalBalanceGaugeTypeId] [int] NULL,
                [ManaLevelWithCorrection] [decimal](18, 2) NULL,
                [ElementalBalanceWithCorrection] [decimal](18, 2) NULL,
                [SpellResearchId] [uniqueidentifier] NULL,
                [AetherDensityValue] [decimal](18, 2) NULL,
                [MagicalFieldValue] [decimal](18, 2) NULL,
                [ManaLevelValue] [decimal](18, 2) NULL,
                [ElementalBalanceValue] [decimal](18, 2) NULL,
                [ParentId] [uniqueidentifier] NULL,
                [IsLocked] [bit] NOT NULL,
                CONSTRAINT [PK_SpellResearchEnvironment] PRIMARY KEY CLUSTERED ([Id] ASC),
                CONSTRAINT [AK_SpellResearchEnvironment_HelpId] UNIQUE NONCLUSTERED ([HelpId] ASC)
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        // Should have all columns
        expect(table.columns.length).toBeGreaterThan(30);

        // Check nvarchar(max) handling
        expect(
            table.columns.find((c) => c.name === 'CreatedByUsername')?.type
        ).toBe('nvarchar');

        // Check decimal precision handling
        const decimalColumn = table.columns.find(
            (c) => c.name === 'ManaLevelStart'
        );
        expect(decimalColumn?.type).toBe('decimal');
        expect(decimalColumn?.typeArgs).toEqual([18, 2]);

        // Check unique constraint was converted to index
        expect(table.indexes).toHaveLength(1);
        expect(table.indexes[0].name).toBe(
            'AK_SpellResearchEnvironment_HelpId'
        );
        expect(table.indexes[0].unique).toBe(true);
        expect(table.indexes[0].columns).toContain('HelpId');
    });

    it('should handle complex decimal types like decimal(31, 15)', async () => {
        const sql = `
            CREATE TABLE [artifacts].[RelicPowerCalculatedValues](
                [Id] [uniqueidentifier] NOT NULL,
                [MagicalEnergyMeasured] [decimal](31, 15) NOT NULL,
                [AuraIntensityMeasured] [decimal](31, 15) NOT NULL,
                [ResonanceFrequencyMeasured] [decimal](31, 15) NOT NULL,
                [DimensionalFluxMeasured] [decimal](31, 15) NOT NULL,
                [MagicalEnergyCorrection] [decimal](31, 15) NULL,
                [AuraIntensityCorrection] [decimal](31, 15) NULL,
                [ResonanceFrequencyCorrection] [decimal](31, 15) NULL,
                [DimensionalFluxCorrection] [decimal](31, 15) NULL,
                CONSTRAINT [PK_RelicPowerCalculatedValues] PRIMARY KEY CLUSTERED ([Id] ASC)
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        // Check high precision decimal handling
        const magicalEnergyColumn = table.columns.find(
            (c) => c.name === 'MagicalEnergyMeasured'
        );
        expect(magicalEnergyColumn?.type).toBe('decimal');
        expect(magicalEnergyColumn?.typeArgs).toEqual([31, 15]);
    });

    it('should handle IDENTITY columns in artifact lookup tables', async () => {
        const sql = `
            CREATE TABLE [artifacts].[SpellComponent](
                [Id] [int] IDENTITY(1,1) NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [ComponentName] [nvarchar](max) NOT NULL,
                CONSTRAINT [PK_SpellComponent] PRIMARY KEY CLUSTERED ([Id] ASC)
            );

            CREATE TABLE [artifacts].[RuneType](
                [Id] [int] IDENTITY(1,1) NOT NULL,
                [IsDeleted] [bit] NOT NULL,
                [DeletedAt] [datetime2](7) NULL,
                [Name] [nvarchar](max) NOT NULL,
                [Symbol] [nvarchar](max) NOT NULL,
                [MagicSchoolId] [int] NOT NULL,
                CONSTRAINT [PK_RuneType] PRIMARY KEY CLUSTERED ([Id] ASC)
            );
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(2);

        // Both tables should have IDENTITY columns
        result.tables.forEach((table) => {
            const idColumn = table.columns.find((c) => c.name === 'Id');
            expect(idColumn?.increment).toBe(true);
            expect(idColumn?.type).toBe('int');
        });
    });

    it('should parse all table constraints with complex WITH options', async () => {
        const sql = `
            CREATE TABLE [dbo].[MagicalRegistry](
                [Id] [uniqueidentifier] NOT NULL,
                [RegistrationCode] [nvarchar](50) NOT NULL,
                [PowerLevel] [int] NOT NULL,
                CONSTRAINT [PK_MagicalRegistry] PRIMARY KEY CLUSTERED 
                (
                    [Id] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                CONSTRAINT [UQ_MagicalRegistry_Code] UNIQUE NONCLUSTERED 
                (
                    [RegistrationCode] ASC
                )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
        `;

        const result = await fromSQLServer(sql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];

        // Primary key should be set
        expect(table.columns.find((c) => c.name === 'Id')?.primaryKey).toBe(
            true
        );

        // Unique constraint should be converted to index
        expect(table.indexes).toHaveLength(1);
        expect(table.indexes[0].unique).toBe(true);
        expect(table.indexes[0].columns).toContain('RegistrationCode');
    });
});
