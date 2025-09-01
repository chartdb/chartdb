import { describe, it, expect } from 'vitest';
import { fromPostgres } from '../postgresql';

describe('PostgreSQL ALTER TABLE with Foreign Keys', () => {
    it('should handle ALTER TABLE ADD COLUMN followed by ALTER TABLE ADD FOREIGN KEY', async () => {
        const sql = `
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "public"."location" (
    "id" bigint NOT NULL,
    CONSTRAINT "pk_table_7_id" PRIMARY KEY ("id")
);

-- Add new fields to existing location table
ALTER TABLE location ADD COLUMN country_id INT;
ALTER TABLE location ADD COLUMN state_id INT;
ALTER TABLE location ADD COLUMN location_type_id INT;
ALTER TABLE location ADD COLUMN city_id INT;
ALTER TABLE location ADD COLUMN street TEXT;
ALTER TABLE location ADD COLUMN block TEXT;
ALTER TABLE location ADD COLUMN building TEXT;
ALTER TABLE location ADD COLUMN floor TEXT;
ALTER TABLE location ADD COLUMN apartment TEXT;
ALTER TABLE location ADD COLUMN lat INT;
ALTER TABLE location ADD COLUMN long INT;
ALTER TABLE location ADD COLUMN elevation INT;
ALTER TABLE location ADD COLUMN erp_site_id INT;
ALTER TABLE location ADD COLUMN is_active TEXT;
ALTER TABLE location ADD COLUMN remarks TEXT;

-- Create lookup tables
CREATE TABLE country (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(3) UNIQUE
);

CREATE TABLE state (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_id INT NOT NULL,
    FOREIGN KEY (country_id) REFERENCES country(id)
);

CREATE TABLE location_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state_id INT NOT NULL,
    FOREIGN KEY (state_id) REFERENCES state(id)
);

-- Add foreign key constraints from location to lookup tables
ALTER TABLE location ADD CONSTRAINT fk_location_country 
    FOREIGN KEY (country_id) REFERENCES country(id);
ALTER TABLE location ADD CONSTRAINT fk_location_state 
    FOREIGN KEY (state_id) REFERENCES state(id);
ALTER TABLE location ADD CONSTRAINT fk_location_location_type 
    FOREIGN KEY (location_type_id) REFERENCES location_type(id);
ALTER TABLE location ADD CONSTRAINT fk_location_city 
    FOREIGN KEY (city_id) REFERENCES city(id);
        `;

        const result = await fromPostgres(sql);

        const locationTable = result.tables.find((t) => t.name === 'location');

        // Check tables
        expect(result.tables).toHaveLength(5); // location, country, state, location_type, city

        // Check location table has all columns
        expect(locationTable).toBeDefined();
        expect(locationTable?.columns).toHaveLength(16); // id + 15 added columns

        // Check foreign key relationships
        const locationRelationships = result.relationships.filter(
            (r) => r.sourceTable === 'location'
        );

        // Should have 4 FKs from location to lookup tables + 2 from state/city
        expect(result.relationships.length).toBeGreaterThanOrEqual(6);

        // Check specific foreign keys from location
        expect(
            locationRelationships.some(
                (r) =>
                    r.sourceColumn === 'country_id' &&
                    r.targetTable === 'country'
            )
        ).toBe(true);

        expect(
            locationRelationships.some(
                (r) =>
                    r.sourceColumn === 'state_id' && r.targetTable === 'state'
            )
        ).toBe(true);

        expect(
            locationRelationships.some(
                (r) =>
                    r.sourceColumn === 'location_type_id' &&
                    r.targetTable === 'location_type'
            )
        ).toBe(true);

        expect(
            locationRelationships.some(
                (r) => r.sourceColumn === 'city_id' && r.targetTable === 'city'
            )
        ).toBe(true);
    });
});
