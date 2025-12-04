import { describe, it, expect } from 'vitest';
import { importDBMLToDiagram } from '../dbml-import';
import { DBCustomTypeKind } from '@/lib/domain/db-custom-type';
import { DatabaseType } from '@/lib/domain/database-type';

describe('DBML Import - Fantasy Examples', () => {
    describe('Magical Academy System', () => {
        it('should import a complete magical academy database', async () => {
            const magicalAcademyDBML = `
// Magical Academy Management System
// Handles wizards, apprentices, spells, and magical education

Table schools {
  id uuid [pk, not null]
  name varchar(200) [not null]
  realm varchar(100)
  founding_year integer
  headmaster_id uuid
  motto text
  enchantment_level integer [default: 1]
  is_active boolean [default: true]
  created_at timestamp [default: 'now()']
  updated_at timestamp
  
  Indexes {
    name [unique]
    realm
  }
}

Table wizards {
  id uuid [pk, not null]
  name varchar(200) [not null]
  email varchar(320) [unique, not null]
  school_id uuid [not null]
  specialty varchar(100) // Elemental, Necromancy, Illusion, etc.
  years_of_study integer [default: 0]
  mana_level numeric(10,2) [default: 100.00]
  rank_id integer
  is_active boolean [default: true]
  joined_at timestamp [default: 'now()']
  graduated_at timestamp
  
  Indexes {
    email [unique]
    (school_id, rank_id)
  }
}

Table apprentices {
  id uuid [pk, not null]
  name varchar(200) [not null]
  mentor_id uuid [not null]
  school_id uuid [not null]
  enrollment_date date [not null]
  expected_graduation date
  current_year integer [default: 1]
  house varchar(50)
  familiar_type varchar(100) // Cat, Owl, Toad, etc.
  created_at timestamp [default: 'now()']
  
  Indexes {
    (mentor_id, school_id)
  }
}

Table spells {
  id integer [pk, increment]
  name varchar(200) [not null, unique]
  school_of_magic varchar(100) [not null]
  level integer [not null]
  mana_cost numeric(5,2) [not null]
  cast_time_seconds integer [default: 1]
  description text
  components text[] // Array of spell components
  is_forbidden boolean [default: false]
  created_by uuid
  created_at timestamp [default: 'now()']
  
  Indexes {
    name [unique]
    school_of_magic
    level
  }
}

Table spell_lessons {
  id uuid [pk, not null]
  spell_id integer [not null]
  teacher_id uuid [not null]
  classroom varchar(100)
  scheduled_at timestamp [not null]
  duration_minutes integer [default: 60]
  max_students integer [default: 20]
  enrolled_count integer [default: 0]
  status varchar(20) [default: 'scheduled'] // scheduled, in_progress, completed, cancelled
  notes text
  
  Indexes {
    (teacher_id, scheduled_at)
    spell_id
  }
}

Table grimoires {
  id uuid [pk, not null]
  title varchar(300) [not null]
  author_id uuid
  type_id integer
  page_count integer
  enchantment_type varchar(100)
  library_section varchar(50)
  is_restricted boolean [default: false]
  added_date date [default: 'now()']
  condition varchar(20) [default: 'good'] // pristine, good, fair, poor
  
  Indexes {
    title
    (library_section, is_restricted)
  }
}

Table grimoire_spells {
  grimoire_id uuid [not null]
  spell_id integer [not null]
  page_number integer [not null]
  
  Indexes {
    (grimoire_id, spell_id) [unique]
  }
}

// Relationships
Ref: wizards.school_id > schools.id
Ref: wizards.rank_id > ranks.id
Ref: apprentices.mentor_id > wizards.id
Ref: apprentices.school_id > schools.id
Ref: spells.created_by > wizards.id
Ref: spell_lessons.spell_id > spells.id
Ref: spell_lessons.teacher_id > wizards.id
Ref: grimoires.author_id > wizards.id
Ref: grimoire_spells.grimoire_id > grimoires.id
Ref: grimoire_spells.spell_id > spells.id

// Additional lookup table
Table ranks {
  id integer [pk]
  name varchar(100) [not null, unique]
  min_years_required integer [not null]
  max_spell_level integer [not null]
}`;

            const diagram = await importDBMLToDiagram(magicalAcademyDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify tables
            expect(diagram.tables).toHaveLength(8);

            const tableNames = diagram.tables?.map((t) => t.name).sort() ?? [];
            expect(tableNames).toEqual([
                'apprentices',
                'grimoire_spells',
                'grimoires',
                'ranks',
                'schools',
                'spell_lessons',
                'spells',
                'wizards',
            ]);

            // Verify relationships
            expect(diagram.relationships).toHaveLength(10);

            // Check specific table structure
            const wizardsTable = diagram.tables?.find(
                (t) => t.name === 'wizards'
            );
            expect(wizardsTable).toBeDefined();
            expect(wizardsTable?.fields).toHaveLength(11);

            // Check indexes
            expect(wizardsTable?.indexes).toHaveLength(3);
            const emailIndex = wizardsTable?.indexes.find((idx) =>
                idx.name.includes('email')
            );
            expect(emailIndex?.unique).toBe(true);

            // Check field properties
            const emailField = wizardsTable?.fields.find(
                (f) => f.name === 'email'
            );
            expect(emailField?.unique).toBe(true);
            expect(emailField?.nullable).toBe(false);

            // Check relationships cardinality
            const mentorRelationship = diagram.relationships?.find(
                (r) =>
                    r.sourceTableId ===
                        diagram.tables?.find((t) => t.name === 'apprentices')
                            ?.id &&
                    r.targetTableId ===
                        diagram.tables?.find((t) => t.name === 'wizards')?.id
            );
            expect(mentorRelationship?.sourceCardinality).toBe('many');
            expect(mentorRelationship?.targetCardinality).toBe('one');
        });
    });

    describe('Enchanted Marketplace', () => {
        it('should import an enchanted marketplace with complex features', async () => {
            const marketplaceDBML = `
// Enchanted Marketplace System
// Handles magical merchants, artifacts, and trades

Table merchants [headercolor: #FFD700] {
  id uuid [pk, not null]
  name varchar(200) [not null]
  shop_name varchar(300) [unique, not null]
  specialization varchar(100) // Potions, Wands, Artifacts, Scrolls
  reputation_score numeric(5,2) [default: 50.00]
  gold_balance numeric(12,2) [default: 1000.00]
  location_region varchar(100)
  license_number varchar(50) [unique]
  years_in_business integer [default: 0]
  accepts_trades boolean [default: true]
  created_at timestamp [default: 'now()']
  last_active timestamp
  
  Indexes {
    shop_name [unique]
    location_region
    (specialization, reputation_score)
  }
}

Table artifacts [headercolor: #9370DB] {
  id uuid [pk, not null]
  name varchar(300) [not null]
  type enum // This will be converted to varchar
  rarity varchar(20) [not null] // common, uncommon, rare, epic, legendary
  base_price numeric(10,2) [not null]
  enchantment_charges integer [default: 0]
  description text
  origin_realm varchar(100)
  creator_name varchar(200)
  magical_properties jsonb
  weight_kg numeric(5,2)
  is_cursed boolean [default: false]
  requires_attunement boolean [default: false]
  created_at timestamp [default: 'now()']
  
  Indexes {
    name
    (type, rarity)
    base_price
  }
}

Table merchant_inventory {
  id uuid [pk, not null]
  merchant_id uuid [not null]
  artifact_id uuid [not null]
  quantity integer [not null, default: 1]
  listed_price numeric(10,2) [not null]
  discount_percentage numeric(3,2) [default: 0.00]
  condition varchar(20) [default: 'excellent']
  acquisition_date date
  acquisition_cost numeric(10,2)
  is_featured boolean [default: false]
  notes text
  
  Indexes {
    (merchant_id, artifact_id) [unique]
    listed_price
  }
}

Table customers {
  id uuid [pk, not null]
  name varchar(200) [not null]
  customer_type varchar(50) // adventurer, noble, scholar, collector
  gold_spent_total numeric(12,2) [default: 0.00]
  items_purchased integer [default: 0]
  first_purchase_date date
  last_purchase_date date
  preferred_merchant_id uuid
  loyalty_points integer [default: 0]
  is_vip boolean [default: false]
  contact_crystal varchar(100) // magical communication device ID
  
  Indexes {
    name
    customer_type
  }
}

Table transactions {
  id uuid [pk, not null]
  merchant_id uuid [not null]
  customer_id uuid [not null]
  transaction_date timestamp [not null, default: 'now()']
  total_amount numeric(10,2) [not null]
  payment_method varchar(50) // gold, gems, barter, credit
  status varchar(20) [default: 'completed']
  notes text
  
  Indexes {
    (merchant_id, transaction_date)
    (customer_id, transaction_date)
  }
}

Table transaction_items {
  id uuid [pk, not null]
  transaction_id uuid [not null]
  artifact_id uuid [not null]
  quantity integer [not null, default: 1]
  unit_price numeric(10,2) [not null]
  discount_applied numeric(10,2) [default: 0.00]
  enchantment_warranty_days integer [default: 0]
}

Table trade_offers {
  id uuid [pk, not null]
  offering_customer_id uuid [not null]
  receiving_merchant_id uuid [not null]
  status varchar(20) [default: 'pending'] // pending, accepted, rejected, expired
  offered_items text[] // Array of item descriptions
  requested_artifact_id uuid
  additional_gold_offered numeric(10,2) [default: 0.00]
  created_at timestamp [default: 'now()']
  expires_at timestamp
  merchant_notes text
  
  Indexes {
    (receiving_merchant_id, status)
    expires_at
  }
}

// Relationships
Ref: merchant_inventory.merchant_id > merchants.id
Ref: merchant_inventory.artifact_id > artifacts.id
Ref: customers.preferred_merchant_id > merchants.id
Ref: transactions.merchant_id > merchants.id
Ref: transactions.customer_id > customers.id
Ref: transaction_items.transaction_id > transactions.id
Ref: transaction_items.artifact_id > artifacts.id
Ref: trade_offers.offering_customer_id > customers.id
Ref: trade_offers.receiving_merchant_id > merchants.id
Ref: trade_offers.requested_artifact_id > artifacts.id

// Features that will be removed by preprocessing
TableGroup "Marketplace Core" [color: #FFD700] {
  merchants
  artifacts
  merchant_inventory
}

TableGroup "Trading System" [color: #4169E1] {
  customers
  transactions
  transaction_items
  trade_offers
}

Note marketplace_note {
  'This marketplace handles both standard purchases and barter trades'
}`;

            const diagram = await importDBMLToDiagram(marketplaceDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify tables
            expect(diagram.tables).toHaveLength(7);

            // Verify that table header colors were removed but tables imported correctly
            const merchantsTable = diagram.tables?.find(
                (t) => t.name === 'merchants'
            );
            expect(merchantsTable).toBeDefined();
            expect(merchantsTable?.fields).toHaveLength(12);

            // Check that enum type was converted
            const artifactsTable = diagram.tables?.find(
                (t) => t.name === 'artifacts'
            );
            const typeField = artifactsTable?.fields.find(
                (f) => f.name === 'type'
            );
            expect(typeField?.type.id).toBe('varchar');

            // Check array type conversion
            const tradeOffersTable = diagram.tables?.find(
                (t) => t.name === 'trade_offers'
            );
            const offeredItemsField = tradeOffersTable?.fields.find(
                (f) => f.name === 'offered_items'
            );
            expect(offeredItemsField?.type.id).toBe('text');

            // Verify relationships
            expect(diagram.relationships).toHaveLength(10);

            // Check composite unique index
            const inventoryTable = diagram.tables?.find(
                (t) => t.name === 'merchant_inventory'
            );
            const compositeIndex = inventoryTable?.indexes.find(
                (idx) => idx.fieldIds.length === 2 && idx.unique === true
            );
            expect(compositeIndex).toBeDefined();
        });
    });

    describe('Quest Management System', () => {
        it('should import a quest management system with enums and complex relationships', async () => {
            const questSystemDBML = `
// Quest Management System
// Tracks adventurers, quests, and guild operations

enum quest_status {
  draft
  available
  assigned
  in_progress
  completed
  failed
  expired
}

enum difficulty_level {
  trivial
  easy
  medium
  hard
  legendary
  impossible
}

Table guilds {
  id uuid [pk, not null]
  name varchar(200) [not null, unique]
  motto text
  founded_date date [not null]
  guild_master_id uuid
  treasury_balance numeric(15,2) [default: 10000.00]
  reputation_points integer [default: 1000]
  member_count integer [default: 0]
  headquarters_location varchar(200)
  is_active boolean [default: true]
  
  Indexes {
    name [unique]
    reputation_points
  }
}

Table adventurers {
  id uuid [pk, not null]
  name varchar(200) [not null]
  class varchar(50) [not null] // Warrior, Mage, Rogue, Cleric, etc.
  level integer [default: 1]
  experience_points integer [default: 0]
  guild_id uuid
  specialization varchar(100)
  health_points integer [default: 100]
  mana_points integer [default: 50]
  strength integer [default: 10]
  intelligence integer [default: 10]
  agility integer [default: 10]
  joined_guild_date date
  quest_completion_rate numeric(5,2) [default: 0.00]
  is_active boolean [default: true]
  created_at timestamp [default: 'now()']
  
  Indexes {
    name
    (guild_id, level)
    quest_completion_rate
  }
}

Table quest_givers {
  id uuid [pk, not null]
  name varchar(200) [not null]
  title varchar(100)
  location varchar(200)
  faction varchar(100)
  reputation_required integer [default: 0]
  gives_repeatable_quests boolean [default: false]
  created_at timestamp [default: 'now()']
}

Table quests {
  id uuid [pk, not null]
  title varchar(300) [not null]
  description text [not null]
  quest_giver_id uuid [not null]
  difficulty enum // Will be converted to varchar
  status enum // Will be converted to varchar
  reward_gold numeric(10,2) [default: 0.00]
  reward_experience integer [default: 0]
  reward_items jsonb
  time_limit_hours integer
  min_level_required integer [default: 1]
  max_party_size integer [default: 1]
  location varchar(200)
  created_at timestamp [default: 'now()']
  expires_at timestamp
  completed_at timestamp
  
  Indexes {
    (quest_giver_id, status)
    difficulty
    expires_at
  }
}

Table quest_assignments {
  id uuid [pk, not null]
  quest_id uuid [not null]
  adventurer_id uuid [not null]
  assigned_at timestamp [not null, default: 'now()']
  started_at timestamp
  completed_at timestamp
  failed_at timestamp
  progress_percentage integer [default: 0]
  notes text
  rating integer // 1-5 stars
  
  Indexes {
    (quest_id, adventurer_id) [unique]
    assigned_at
  }
}

Table party_members {
  party_id uuid [not null]
  adventurer_id uuid [not null]
  role varchar(50) // leader, member
  joined_at timestamp [default: 'now()']
  
  Indexes {
    (party_id, adventurer_id) [unique]
  }
}

Table quest_prerequisites {
  quest_id uuid [not null]
  required_quest_id uuid [not null]
  
  Indexes {
    (quest_id, required_quest_id) [unique]
  }
}

// Relationships
Ref: guilds.guild_master_id > adventurers.id
Ref: adventurers.guild_id > guilds.id
Ref: quests.quest_giver_id > quest_givers.id
Ref: quest_assignments.quest_id > quests.id
Ref: quest_assignments.adventurer_id > adventurers.id
Ref: party_members.adventurer_id > adventurers.id
Ref: quest_prerequisites.quest_id > quests.id
Ref: quest_prerequisites.required_quest_id > quests.id

// These will be removed during preprocessing
Note quest_system_note {
  'Quest difficulty and status use enums that will be converted to varchar'
}`;

            const diagram = await importDBMLToDiagram(questSystemDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify tables
            expect(diagram.tables).toHaveLength(7);

            // Check enum conversion
            const questsTable = diagram.tables?.find(
                (t) => t.name === 'quests'
            );
            const difficultyField = questsTable?.fields.find(
                (f) => f.name === 'difficulty'
            );
            const statusField = questsTable?.fields.find(
                (f) => f.name === 'status'
            );

            expect(difficultyField?.type.id).toBe('varchar');
            expect(statusField?.type.id).toBe('varchar');

            // Verify relationships
            expect(diagram.relationships).toHaveLength(8);

            // Check self-referential relationship
            // quest_prerequisites has quest_id and required_quest_id, both pointing to quests table
            // This creates 2 separate relationships
            const questPrereqTable = diagram.tables?.find(
                (t) => t.name === 'quest_prerequisites'
            );
            const relationshipsToQuests =
                diagram.relationships?.filter(
                    (r) =>
                        r.targetTableId === questsTable?.id &&
                        r.sourceTableId === questPrereqTable?.id
                ) ?? [];
            expect(relationshipsToQuests).toHaveLength(2); // quest_prerequisites creates 2 relationships to quests

            // Check composite indexes
            const assignmentsTable = diagram.tables?.find(
                (t) => t.name === 'quest_assignments'
            );
            const uniqueAssignmentIndex = assignmentsTable?.indexes.find(
                (idx) => idx.unique && idx.fieldIds.length === 2
            );
            expect(uniqueAssignmentIndex).toBeDefined();
        });
    });

    describe('Enum Support', () => {
        it('should import enums as customTypes', async () => {
            const dbmlWithEnums = `
// Test DBML with various enum definitions
enum job_status {
  created [note: 'Waiting to be processed']
  running
  done
  failure
}

// Enum with schema
enum hr.employee_type {
  full_time
  part_time
  contractor
  intern
}

// Enum with special characters and spaces
enum grade {
  "A+"
  "A"
  "A-"
  "Not Yet Set"
}

Table employees {
  id integer [pk]
  name varchar(200) [not null]
  status job_status
  type hr.employee_type
  performance_grade grade
  created_at timestamp [default: 'now()']
}

Table projects {
  id integer [pk]
  name varchar(300) [not null]
  status job_status [not null]
  priority enum // inline enum without values - will be converted to varchar
}`;

            const diagram = await importDBMLToDiagram(dbmlWithEnums, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify customTypes are created for enums
            expect(diagram.customTypes).toBeDefined();
            expect(diagram.customTypes).toHaveLength(3); // job_status, hr.employee_type, grade

            // Check job_status enum
            const jobStatusEnum = diagram.customTypes?.find(
                (ct) => ct.name === 'job_status' && !ct.schema
            );
            expect(jobStatusEnum).toBeDefined();
            expect(jobStatusEnum?.kind).toBe(DBCustomTypeKind.enum);
            expect(jobStatusEnum?.values).toEqual([
                'created',
                'running',
                'done',
                'failure',
            ]);

            // Check hr.employee_type enum with schema
            const employeeTypeEnum = diagram.customTypes?.find(
                (ct) => ct.name === 'employee_type' && ct.schema === 'hr'
            );
            expect(employeeTypeEnum).toBeDefined();
            expect(employeeTypeEnum?.kind).toBe(DBCustomTypeKind.enum);
            expect(employeeTypeEnum?.values).toEqual([
                'full_time',
                'part_time',
                'contractor',
                'intern',
            ]);

            // Check grade enum with quoted values
            const gradeEnum = diagram.customTypes?.find(
                (ct) => ct.name === 'grade' && !ct.schema
            );
            expect(gradeEnum).toBeDefined();
            expect(gradeEnum?.kind).toBe(DBCustomTypeKind.enum);
            expect(gradeEnum?.values).toEqual(['A+', 'A', 'A-', 'Not Yet Set']);

            // Verify tables are created
            expect(diagram.tables).toHaveLength(2);

            // Check that enum fields in tables reference the custom types
            const employeesTable = diagram.tables?.find(
                (t) => t.name === 'employees'
            );
            const statusField = employeesTable?.fields.find(
                (f) => f.name === 'status'
            );
            const typeField = employeesTable?.fields.find(
                (f) => f.name === 'type'
            );
            const gradeField = employeesTable?.fields.find(
                (f) => f.name === 'performance_grade'
            );

            // Verify fields have correct types
            expect(statusField?.type.id).toBe('job_status');
            expect(typeField?.type.id).toBe('employee_type');
            expect(gradeField?.type.id).toBe('grade');

            // Check inline enum was converted to varchar
            const projectsTable = diagram.tables?.find(
                (t) => t.name === 'projects'
            );
            const priorityField = projectsTable?.fields.find(
                (f) => f.name === 'priority'
            );
            expect(priorityField?.type.id).toBe('varchar');
        });

        it('should handle enum values with notes', async () => {
            const dbmlWithEnumNotes = `
enum order_status {
  pending [note: 'Order has been placed but not confirmed']
  confirmed [note: 'Payment received and order confirmed']
  shipped [note: 'Order has been dispatched']
  delivered [note: 'Order delivered to customer']
  cancelled [note: 'Order cancelled by customer or system']
}

Table orders {
  id integer [pk]
  status order_status [not null]
}`;

            const diagram = await importDBMLToDiagram(dbmlWithEnumNotes, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify enum is created
            expect(diagram.customTypes).toHaveLength(1);

            const orderStatusEnum = diagram.customTypes?.[0];
            expect(orderStatusEnum?.name).toBe('order_status');
            expect(orderStatusEnum?.kind).toBe(DBCustomTypeKind.enum);
            expect(orderStatusEnum?.values).toEqual([
                'pending',
                'confirmed',
                'shipped',
                'delivered',
                'cancelled',
            ]);
        });

        it('should handle multiple schemas with same enum names', async () => {
            const dbmlWithSameEnumNames = `
// Public schema status enum
enum status {
  active
  inactive
  deleted
}

// Admin schema status enum with different values
enum admin.status {
  pending_approval
  approved
  rejected
  suspended
}

Table public.users {
  id integer [pk]
  status status
}

Table admin.users {
  id integer [pk]
  status admin.status
}`;

            const diagram = await importDBMLToDiagram(dbmlWithSameEnumNames, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify both enums are created
            expect(diagram.customTypes).toHaveLength(2);

            // Check public.status enum
            const publicStatusEnum = diagram.customTypes?.find(
                (ct) => ct.name === 'status' && !ct.schema
            );
            expect(publicStatusEnum).toBeDefined();
            expect(publicStatusEnum?.values).toEqual([
                'active',
                'inactive',
                'deleted',
            ]);

            // Check admin.status enum
            const adminStatusEnum = diagram.customTypes?.find(
                (ct) => ct.name === 'status' && ct.schema === 'admin'
            );
            expect(adminStatusEnum).toBeDefined();
            expect(adminStatusEnum?.values).toEqual([
                'pending_approval',
                'approved',
                'rejected',
                'suspended',
            ]);

            // Verify fields reference correct enums
            // Note: 'public' schema is converted to empty string
            const publicUsersTable = diagram.tables?.find(
                (t) => t.name === 'users' && t.schema === ''
            );
            const adminUsersTable = diagram.tables?.find(
                (t) => t.name === 'users' && t.schema === 'admin'
            );

            const publicStatusField = publicUsersTable?.fields.find(
                (f) => f.name === 'status'
            );
            const adminStatusField = adminUsersTable?.fields.find(
                (f) => f.name === 'status'
            );

            expect(publicStatusField?.type.id).toBe('status');
            expect(adminStatusField?.type.id).toBe('status');
        });
    });

    describe('Edge Cases and Special Features', () => {
        it('should handle tables with all DBML features', async () => {
            const edgeCaseDBML = `
// Testing all DBML features and edge cases

Table dragon_hoards [headercolor: #FF6347] {
  id bigint [pk, increment]
  dragon_name varchar(200) [not null]
  hoard_value numeric(20,2) [default: 0.00]
  item_manifest text[] // Array of treasure descriptions
  location_coordinates jsonb
  security_spells text[]
  last_inventory_date date
  guardian_type enum // Will be converted to varchar
  is_active boolean [default: true]
  notes text [note: 'Internal notes about the hoard']
  
  Note: 'This table tracks dragon treasure hoards'
  
  Indexes {
    dragon_name [unique, name: "idx_unique_dragon"]
    hoard_value [name: "idx_hoard_value"]
    (dragon_name, is_active) [name: "idx_dragon_active"]
  }
}

Table treasure_items {
  id uuid [pk, default: 'gen_random_uuid()']
  hoard_id bigint [not null]
  item_name varchar(300) [not null]
  item_type varchar(50) // gold, gems, artifacts, weapons
  quantity integer [default: 1]
  unit_value numeric(10,2)
  total_value numeric(15,2) [note: 'Calculated as quantity * unit_value']
  magical_properties jsonb
  cursed boolean [default: false]
  
  Indexes {
    (hoard_id, item_name) [unique]
  }
}

// Complex relationship
Ref: treasure_items.hoard_id > dragon_hoards.id [delete: cascade, update: cascade]

TableGroup "Dragon Treasury" [color: #FF6347] {
  dragon_hoards
  treasure_items
}

Note dragon_note {
  'Dragons are very protective of their hoards!'
}`;

            const diagram = await importDBMLToDiagram(edgeCaseDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify preprocessing worked
            expect(diagram.tables).toHaveLength(2);

            // Check array type conversion
            const hoardsTable = diagram.tables?.find(
                (t) => t.name === 'dragon_hoards'
            );
            const manifestField = hoardsTable?.fields.find(
                (f) => f.name === 'item_manifest'
            );
            const spellsField = hoardsTable?.fields.find(
                (f) => f.name === 'security_spells'
            );

            expect(manifestField?.type.id).toBe('text');
            expect(spellsField?.type.id).toBe('text');

            // Check enum conversion
            const guardianField = hoardsTable?.fields.find(
                (f) => f.name === 'guardian_type'
            );
            expect(guardianField?.type.id).toBe('varchar');

            // Check that table header color was removed
            expect(hoardsTable).toBeDefined();

            // Verify all indexes are imported correctly
            expect(hoardsTable?.indexes).toHaveLength(4); // 3 from DBML + 1 implicit PK index

            // Verify named indexes
            const uniqueDragonIndex = hoardsTable?.indexes.find(
                (idx) => idx.name === 'idx_unique_dragon'
            );
            expect(uniqueDragonIndex).toBeDefined();
            expect(uniqueDragonIndex?.name).toBe('idx_unique_dragon'); // Verify exact name from DBML
            expect(uniqueDragonIndex?.unique).toBe(true);
            expect(uniqueDragonIndex?.fieldIds).toHaveLength(1);

            const hoardValueIndex = hoardsTable?.indexes.find(
                (idx) => idx.name === 'idx_hoard_value'
            );
            expect(hoardValueIndex).toBeDefined();
            expect(hoardValueIndex?.name).toBe('idx_hoard_value'); // Verify exact name from DBML
            expect(hoardValueIndex?.unique).toBe(false);
            expect(hoardValueIndex?.fieldIds).toHaveLength(1);

            const dragonActiveIndex = hoardsTable?.indexes.find(
                (idx) => idx.name === 'idx_dragon_active'
            );
            expect(dragonActiveIndex).toBeDefined();
            expect(dragonActiveIndex?.name).toBe('idx_dragon_active'); // Verify exact name from DBML
            expect(dragonActiveIndex?.unique).toBe(false);
            expect(dragonActiveIndex?.fieldIds).toHaveLength(2);

            // Check relationship
            expect(diagram.relationships).toHaveLength(1);
            const relationship = diagram.relationships?.[0];
            expect(relationship?.sourceCardinality).toBe('many');
            expect(relationship?.targetCardinality).toBe('one');
        });

        it('should handle empty DBML gracefully', async () => {
            const emptyDBML = '';
            const diagram = await importDBMLToDiagram(emptyDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(0);
            expect(diagram.relationships).toHaveLength(0);
        });

        it('should handle DBML with only comments', async () => {
            const commentOnlyDBML = `
// This is a comment
// Another comment
/* Multi-line
   comment */
`;
            const diagram = await importDBMLToDiagram(commentOnlyDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(0);
            expect(diagram.relationships).toHaveLength(0);
        });

        it('should handle tables with minimal fields', async () => {
            const minimalDBML = `
Table empty_table {
  id int
}`;
            const diagram = await importDBMLToDiagram(minimalDBML, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(1);
            expect(diagram.tables?.[0]?.fields).toHaveLength(1);
            expect(diagram.tables?.[0]?.name).toBe('empty_table');
        });

        it('should import tables with same name but different schemas', async () => {
            const dbml = `
Table "aa"."users" {
  id integer [primary key]
}

Table "bb"."users" {
  id integer [primary key]
}`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(2);

            const aaUsersTable = diagram.tables?.find(
                (t) => t.name === 'users' && t.schema === 'aa'
            );
            const bbUsersTable = diagram.tables?.find(
                (t) => t.name === 'users' && t.schema === 'bb'
            );

            expect(aaUsersTable).toBeDefined();
            expect(bbUsersTable).toBeDefined();

            expect(aaUsersTable?.schema).toBe('aa');
            expect(bbUsersTable?.schema).toBe('bb');

            expect(aaUsersTable?.fields).toHaveLength(1);
            expect(bbUsersTable?.fields).toHaveLength(1);

            expect(aaUsersTable?.fields[0].name).toBe('id');
            expect(aaUsersTable?.fields[0].type.id).toBe('int');
            expect(aaUsersTable?.fields[0].primaryKey).toBe(true);

            expect(bbUsersTable?.fields[0].name).toBe('id');
            expect(bbUsersTable?.fields[0].type.id).toBe('int');
            expect(bbUsersTable?.fields[0].primaryKey).toBe(true);
        });

        it('should import complex multi-schema DBML with inline refs and various indexes', async () => {
            // This test validates:
            // - 3 tables across different schemas (public, public_2, public_3)
            // - Table-level notes (Note: 'my comment' on users table)
            // - 3 indexes:
            //   * Composite unique index: (content, user_id) on posts table
            //   * Single non-unique index: created_at on posts table
            //   * Single unique index: id on comments table
            // - 3 inline foreign key relationships:
            //   * posts.user_id -> users.id
            //   * comments.post_id -> posts.id
            //   * comments.user_id -> users.id
            // - Quoted identifiers for all table and field names

            const dbml = `
Table "public"."users" {
  "id" varchar(500) [pk]
  "name" varchar(500)
  "email" varchar(500)
  Note: 'my comment'
}

Table "public_2"."posts" {
  "id" varchar(500) [pk]
  "title" varchar(500)
  "content" text
  "user_id" varchar(500) [ref: < "public"."users"."id"]
  "created_at" timestamp

  Indexes {
    (content, user_id) [unique, name: "public_2_content_user_id_idx"]
    created_at [name: "public_2_index_2"]
  }
}

Table "public_3"."comments" {
  "id" varchar(500) [pk]
  "content" text
  "post_id" varchar(500) [ref: < "public_2"."posts"."id"]
  "user_id" varchar(500) [ref: < "public"."users"."id"]
  "created_at" timestamp

  Indexes {
    id [unique, name: "public_3_index_1"]
  }
}`;
            const diagram = await importDBMLToDiagram(dbml, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            // Verify tables
            expect(diagram.tables).toHaveLength(3);

            // Note: 'public' schema is converted to empty string
            const usersTable = diagram.tables?.find(
                (t) => t.name === 'users' && t.schema === ''
            );
            const postsTable = diagram.tables?.find(
                (t) => t.name === 'posts' && t.schema === 'public_2'
            );
            const commentsTable = diagram.tables?.find(
                (t) => t.name === 'comments' && t.schema === 'public_3'
            );

            expect(usersTable).toBeDefined();
            expect(postsTable).toBeDefined();
            expect(commentsTable).toBeDefined();

            // Check users table
            expect(usersTable?.fields).toHaveLength(3);
            expect(
                usersTable?.fields.find((f) => f.name === 'id')?.primaryKey
            ).toBe(true);
            expect(
                usersTable?.fields.find((f) => f.name === 'id')?.type.id
            ).toBe('varchar');
            expect(
                usersTable?.fields.find((f) => f.name === 'name')?.type.id
            ).toBe('varchar');
            expect(
                usersTable?.fields.find((f) => f.name === 'email')?.type.id
            ).toBe('varchar');

            // Check if table note is preserved
            expect(usersTable?.comments).toBe('my comment');

            // Check posts table
            expect(postsTable?.fields).toHaveLength(5);
            expect(
                postsTable?.fields.find((f) => f.name === 'content')?.type.id
            ).toBe('text');
            expect(
                postsTable?.fields.find((f) => f.name === 'created_at')?.type.id
            ).toBe('timestamp');

            // Check posts indexes thoroughly
            expect(postsTable?.indexes).toHaveLength(3);

            // Index 1: Composite unique index on (content, user_id)
            const compositeIndex = postsTable?.indexes.find(
                (idx) => idx.name === 'public_2_content_user_id_idx'
            );
            expect(compositeIndex).toBeDefined();
            expect(compositeIndex?.name).toBe('public_2_content_user_id_idx'); // Verify exact name from DBML
            expect(compositeIndex?.unique).toBe(true);
            expect(compositeIndex?.fieldIds).toHaveLength(2);
            // Verify it includes the correct fields
            const contentFieldId = postsTable?.fields.find(
                (f) => f.name === 'content'
            )?.id;
            const userIdFieldId = postsTable?.fields.find(
                (f) => f.name === 'user_id'
            )?.id;
            expect(compositeIndex?.fieldIds).toContain(contentFieldId);
            expect(compositeIndex?.fieldIds).toContain(userIdFieldId);

            // Index 2: Non-unique index on created_at
            const singleIndex = postsTable?.indexes.find(
                (idx) => idx.name === 'public_2_index_2'
            );
            expect(singleIndex).toBeDefined();
            expect(singleIndex?.name).toBe('public_2_index_2'); // Verify exact name from DBML
            expect(singleIndex?.unique).toBe(false);
            expect(singleIndex?.fieldIds).toHaveLength(1);
            const createdAtFieldId = postsTable?.fields.find(
                (f) => f.name === 'created_at'
            )?.id;
            expect(singleIndex?.fieldIds[0]).toBe(createdAtFieldId);

            // Check comments table
            expect(commentsTable?.fields).toHaveLength(5);
            expect(commentsTable?.indexes).toHaveLength(2);

            // Index: Unique index on id
            const idIndex = commentsTable?.indexes.find(
                (idx) => idx.name === 'public_3_index_1'
            );
            expect(idIndex).toBeDefined();
            expect(idIndex?.name).toBe('public_3_index_1'); // Verify exact name from DBML
            expect(idIndex?.unique).toBe(true);
            expect(idIndex?.fieldIds).toHaveLength(1);
            const idFieldId = commentsTable?.fields.find(
                (f) => f.name === 'id'
            )?.id;
            expect(idIndex?.fieldIds[0]).toBe(idFieldId);

            // Verify relationships (inline refs should create relationships)
            // From DBML:
            // 1. posts.user_id -> users.id
            // 2. comments.post_id -> posts.id
            // 3. comments.user_id -> users.id
            expect(diagram.relationships).toHaveLength(3);

            // Find relationships - check the actual field references
            const findRelationshipByFields = (
                sourceTableId: string,
                sourceFieldName: string,
                targetTableId: string,
                targetFieldName: string
            ) => {
                const sourceField = diagram.tables
                    ?.find((t) => t.id === sourceTableId)
                    ?.fields.find((f) => f.name === sourceFieldName);
                const targetField = diagram.tables
                    ?.find((t) => t.id === targetTableId)
                    ?.fields.find((f) => f.name === targetFieldName);

                return diagram.relationships?.find(
                    (r) =>
                        (r.sourceFieldId === sourceField?.id &&
                            r.targetFieldId === targetField?.id) ||
                        (r.sourceFieldId === targetField?.id &&
                            r.targetFieldId === sourceField?.id)
                );
            };

            // Relationship 1: posts.user_id -> users.id
            const postsUsersRel = findRelationshipByFields(
                postsTable!.id,
                'user_id',
                usersTable!.id,
                'id'
            );
            expect(postsUsersRel).toBeDefined();
            expect(postsUsersRel?.sourceSchema).toBeDefined();
            expect(postsUsersRel?.targetSchema).toBeDefined();

            // Relationship 2: comments.post_id -> posts.id
            const commentsPostsRel = findRelationshipByFields(
                commentsTable!.id,
                'post_id',
                postsTable!.id,
                'id'
            );
            expect(commentsPostsRel).toBeDefined();

            // Relationship 3: comments.user_id -> users.id
            const commentsUsersRel = findRelationshipByFields(
                commentsTable!.id,
                'user_id',
                usersTable!.id,
                'id'
            );
            expect(commentsUsersRel).toBeDefined();

            // Verify all relationships have the expected cardinality
            // In DBML, inline refs create relationships where the referenced table (with PK)
            // is the "one" side and the referencing table (with FK) is the "many" side
            const allOneToMany = diagram.relationships?.every(
                (r) =>
                    r.sourceCardinality === 'one' &&
                    r.targetCardinality === 'many'
            );
            expect(allOneToMany).toBe(true);

            // Verify schemas are preserved in relationships
            const relationshipsHaveSchemas = diagram.relationships?.every(
                (r) =>
                    r.sourceSchema !== undefined && r.targetSchema !== undefined
            );
            expect(relationshipsHaveSchemas).toBe(true);
        });
    });

    describe('Notes Support', () => {
        it('should import table with note', async () => {
            const dbmlWithTableNote = `
Table products {
  id integer [pk]
  name varchar(100)
  Note: 'This table stores product information'
}`;

            const diagram = await importDBMLToDiagram(dbmlWithTableNote, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(1);
            const productsTable = diagram.tables?.[0];
            expect(productsTable?.name).toBe('products');
            expect(productsTable?.comments).toBe(
                'This table stores product information'
            );
        });

        it('should import field with note', async () => {
            const dbmlWithFieldNote = `
Table orders {
  id integer [pk]
  total numeric(10,2) [note: 'Order total including tax']
}`;

            const diagram = await importDBMLToDiagram(dbmlWithFieldNote, {
                databaseType: DatabaseType.POSTGRESQL,
            });

            expect(diagram.tables).toHaveLength(1);
            const ordersTable = diagram.tables?.[0];
            expect(ordersTable?.fields).toHaveLength(2);

            const totalField = ordersTable?.fields.find(
                (f) => f.name === 'total'
            );

            // Field notes should be imported
            expect(totalField).toBeDefined();
            expect(totalField?.name).toBe('total');
            expect(totalField?.comments).toBe('Order total including tax');
        });
    });
});
