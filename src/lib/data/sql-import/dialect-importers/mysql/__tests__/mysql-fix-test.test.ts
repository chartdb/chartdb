import { describe, it, expect } from 'vitest';
import { fromMySQLImproved } from '../mysql-improved';

describe('MySQL Fix Test', () => {
    it('should parse foreign keys with comments containing commas', async () => {
        const sql = `
CREATE TABLE product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    badge_text VARCHAR(50), -- "Beliebt", "Empfohlen", etc.
    color_code VARCHAR(7), -- Hex-Farbe für UI
    FOREIGN KEY (category_id) REFERENCES product_categories(id)
);`;

        const result = await fromMySQLImproved(sql, { skipValidation: true });

        console.log(
            'Tables:',
            result.tables.map((t) => t.name)
        );
        console.log('Relationships:', result.relationships.length);
        result.relationships.forEach((r) => {
            console.log(
                `  ${r.sourceTable}.${r.sourceColumn} -> ${r.targetTable}.${r.targetColumn}`
            );
        });

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);
        expect(result.relationships[0]).toMatchObject({
            sourceTable: 'packages',
            sourceColumn: 'category_id',
            targetTable: 'product_categories',
            targetColumn: 'id',
        });
    });

    it('should parse the actual packages table from the file', async () => {
        const sql = `
CREATE TABLE product_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pakete (für VServer, Game-Server, Web-Hosting)
CREATE TABLE packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Paket-Eigenschaften
    is_popular BOOLEAN DEFAULT FALSE,
    badge_text VARCHAR(50), -- Examples: "Beliebt", "Empfohlen", etc.
    color_code VARCHAR(7), -- Hex color for UI
    
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES product_categories(id),
    
    -- Only categories with packages: VServer(2), Game-Server(1), Web-Hosting(4)
    CHECK (category_id IN (1, 2, 4))
);`;

        const result = await fromMySQLImproved(sql, { skipValidation: true });

        console.log('\nActual packages table test:');
        console.log(
            'Tables:',
            result.tables.map((t) => t.name)
        );
        console.log('Relationships:', result.relationships.length);
        result.relationships.forEach((r) => {
            console.log(
                `  ${r.sourceTable}.${r.sourceColumn} -> ${r.targetTable}.${r.targetColumn}`
            );
        });

        const packagesRelationships = result.relationships.filter(
            (r) => r.sourceTable === 'packages'
        );
        expect(packagesRelationships).toHaveLength(1);
    });
});
