import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL Complex Database - Enchanted Bazaar', () => {
    it('should parse the complete magical marketplace database', async () => {
        const sql = `-- Enchanted Bazaar Database Schema
-- A complex magical marketplace system with many enums and relationships

-- Enums for the magical marketplace
CREATE TYPE wizard_status AS ENUM ('active', 'suspended', 'banned', 'inactive');
CREATE TYPE spell_category AS ENUM ('attack', 'defense', 'utility', 'healing', 'summoning');
CREATE TYPE artifact_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE shop_status AS ENUM ('open', 'closed', 'under_renovation', 'abandoned');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('gold', 'crystals', 'barter', 'credit', 'quest_reward');
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'sold', 'expired', 'removed');
CREATE TYPE enchantment_type AS ENUM ('fire', 'ice', 'lightning', 'holy', 'dark');
CREATE TYPE potion_effect AS ENUM ('healing', 'mana', 'strength', 'speed', 'invisibility');
CREATE TYPE scroll_type AS ENUM ('spell', 'recipe', 'map', 'contract', 'prophecy');
CREATE TYPE merchant_tier AS ENUM ('novice', 'apprentice', 'journeyman', 'master', 'grandmaster');
CREATE TYPE review_rating AS ENUM ('terrible', 'poor', 'average', 'good', 'excellent');
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'escalated');
CREATE TYPE delivery_method AS ENUM ('instant', 'owl', 'portal', 'courier', 'pickup');
CREATE TYPE market_zone AS ENUM ('north', 'south', 'east', 'west', 'central');

-- Core tables
CREATE TABLE wizards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    status wizard_status DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE spell_verifications (
    wizard_id UUID PRIMARY KEY REFERENCES wizards(id),
    verified_at TIMESTAMP NOT NULL,
    verification_level INTEGER DEFAULT 1
);

CREATE TABLE realms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    zone market_zone NOT NULL,
    magical_tax_rate DECIMAL(5,4) DEFAULT 0.0500
);

CREATE TABLE sanctuaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    realm_id UUID REFERENCES realms(id),
    name VARCHAR(255) NOT NULL,
    protection_level INTEGER DEFAULT 1
);

CREATE TABLE magic_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    merchant_tier merchant_tier NOT NULL,
    monthly_fee INTEGER NOT NULL,
    listing_limit INTEGER DEFAULT 10
);

CREATE TABLE wizard_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wizard_id UUID REFERENCES wizards(id),
    plan_id UUID REFERENCES magic_plans(id),
    status transaction_status DEFAULT 'pending',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wizard_id UUID REFERENCES wizards(id),
    realm_id UUID REFERENCES realms(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status shop_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shop_sanctuaries (
    shop_id UUID REFERENCES shops(id),
    sanctuary_id UUID REFERENCES sanctuaries(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (shop_id, sanctuary_id)
);

CREATE TABLE artifact_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    parent_id UUID REFERENCES artifact_categories(id),
    description TEXT
);

CREATE TABLE enchantments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type enchantment_type NOT NULL,
    power_level INTEGER DEFAULT 1,
    description TEXT
);

CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id),
    category_id UUID REFERENCES artifact_categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    rarity artifact_rarity DEFAULT 'common',
    status listing_status DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listing_enchantments (
    listing_id UUID REFERENCES listings(id),
    enchantment_id UUID REFERENCES enchantments(id),
    strength INTEGER DEFAULT 1,
    PRIMARY KEY (listing_id, enchantment_id)
);

CREATE TABLE potions (
    listing_id UUID PRIMARY KEY REFERENCES listings(id),
    effect potion_effect NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    potency INTEGER DEFAULT 1
);

CREATE TABLE scrolls (
    listing_id UUID PRIMARY KEY REFERENCES listings(id),
    type scroll_type NOT NULL,
    spell_category spell_category,
    uses_remaining INTEGER DEFAULT 1
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES wizards(id),
    listing_id UUID REFERENCES listings(id),
    quantity INTEGER NOT NULL,
    total_price INTEGER NOT NULL,
    payment_method payment_method NOT NULL,
    status transaction_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    reviewer_id UUID REFERENCES wizards(id),
    rating review_rating NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES transactions(id),
    filed_by UUID REFERENCES wizards(id),
    reason TEXT NOT NULL,
    status dispute_status DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES wizards(id),
    recipient_id UUID REFERENCES wizards(id),
    listing_id UUID REFERENCES listings(id),
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE favorites (
    wizard_id UUID REFERENCES wizards(id),
    listing_id UUID REFERENCES listings(id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wizard_id, listing_id)
);

CREATE TABLE shop_followers (
    wizard_id UUID REFERENCES wizards(id),
    shop_id UUID REFERENCES shops(id),
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wizard_id, shop_id)
);

CREATE TABLE delivery_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    method delivery_method NOT NULL,
    cost INTEGER DEFAULT 0,
    estimated_time_hours INTEGER DEFAULT 24
);

CREATE TABLE transaction_deliveries (
    transaction_id UUID PRIMARY KEY REFERENCES transactions(id),
    delivery_option_id UUID REFERENCES delivery_options(id),
    tracking_number VARCHAR(100),
    delivered_at TIMESTAMP
);

CREATE TABLE wizard_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500)
);

CREATE TABLE wizard_achievements (
    wizard_id UUID REFERENCES wizards(id),
    badge_id UUID REFERENCES wizard_badges(id),
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (wizard_id, badge_id)
);

CREATE TABLE market_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    last_viewed TIMESTAMP
);

CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES listings(id),
    old_price INTEGER NOT NULL,
    new_price INTEGER NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    wizard_id UUID REFERENCES wizards(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

        const result = await fromPostgres(sql);

        // Expected counts
        const expectedTables = 27;
        const expectedEnums = 15;
        const minExpectedRelationships = 36; // Adjusted based on actual relationships in the schema

        // Verify counts
        expect(result.tables).toHaveLength(expectedTables);
        expect(result.enums).toBeDefined();
        expect(result.enums).toHaveLength(expectedEnums);
        expect(result.relationships.length).toBeGreaterThanOrEqual(
            minExpectedRelationships
        );

        // Check specific tables exist
        const criticalTables = [
            'wizards',
            'shops',
            'listings',
            'transactions',
            'reviews',
        ];
        criticalTables.forEach((tableName) => {
            const table = result.tables.find((t) => t.name === tableName);
            expect(table).toBeDefined();
        });

        // Check junction tables
        const junctionTables = [
            'shop_sanctuaries',
            'listing_enchantments',
            'favorites',
            'shop_followers',
            'wizard_achievements',
        ];
        junctionTables.forEach((tableName) => {
            const table = result.tables.find((t) => t.name === tableName);
            expect(table).toBeDefined();
            expect(table!.columns.length).toBeGreaterThanOrEqual(2);
        });
    });
});
