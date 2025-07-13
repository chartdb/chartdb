import { describe, it, expect } from 'vitest';
import { fromMySQL } from '../mysql';
import { sqlImportToDiagram, detectDatabaseType } from '../../../index';
import { DatabaseType } from '@/lib/domain/database-type';

describe('MariaDB Integration', () => {
    it('should detect MariaDB from SQL dump', () => {
        const mariaDbSql = `
-- MariaDB dump 10.19  Distrib 10.11.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: fantasy_db
-- ------------------------------------------------------
-- Server version	10.11.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE TABLE magic_realms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;

        const detectedType = detectDatabaseType(mariaDbSql);
        expect(detectedType).toBe(DatabaseType.MARIADB);
    });

    it('should parse MariaDB SQL using MySQL parser', async () => {
        const mariaDbSql = `
CREATE TABLE wizards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    power_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE spells (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    wizard_id INT NOT NULL,
    mana_cost INT DEFAULT 10,
    FOREIGN KEY (wizard_id) REFERENCES wizards(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;

        const result = await fromMySQL(mariaDbSql);

        expect(result.tables).toHaveLength(2);
        expect(result.relationships).toHaveLength(1);

        const wizards = result.tables.find((t) => t.name === 'wizards');
        expect(wizards?.columns).toHaveLength(5);

        const fk = result.relationships[0];
        expect(fk.sourceTable).toBe('spells');
        expect(fk.targetTable).toBe('wizards');
        expect(fk.deleteAction).toBe('CASCADE');
    });

    it('should handle MariaDB-specific storage engines', async () => {
        const mariaDbSql = `
-- Using Aria storage engine (MariaDB specific)
CREATE TABLE magical_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=Aria DEFAULT CHARSET=utf8mb4;

-- Using ColumnStore engine (MariaDB specific)
CREATE TABLE spell_analytics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    spell_name VARCHAR(200),
    cast_count BIGINT DEFAULT 0,
    avg_mana_cost DECIMAL(10,2)
) ENGINE=COLUMNSTORE DEFAULT CHARSET=utf8mb4;`;

        const result = await fromMySQL(mariaDbSql);

        expect(result.tables).toHaveLength(2);
        expect(
            result.tables.find((t) => t.name === 'magical_logs')
        ).toBeDefined();
        expect(
            result.tables.find((t) => t.name === 'spell_analytics')
        ).toBeDefined();
    });

    it('should handle MariaDB-specific data types', async () => {
        const mariaDbSql = `
CREATE TABLE advanced_spells (
    id INT AUTO_INCREMENT PRIMARY KEY,
    spell_id UUID,  -- MariaDB has native UUID type
    spell_data JSON,  -- JSON support
    cast_location POINT,  -- Geometry type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;`;

        const result = await fromMySQL(mariaDbSql);

        expect(result.tables).toHaveLength(1);
        const table = result.tables[0];
        expect(table.columns).toHaveLength(5);

        const uuidCol = table.columns.find((c) => c.name === 'spell_id');
        expect(uuidCol?.type).toBe('UUID');

        const jsonCol = table.columns.find((c) => c.name === 'spell_data');
        expect(jsonCol?.type).toBe('JSON');
    });

    it('should work with sqlImportToDiagram for MariaDB', async () => {
        const mariaDbSql = `
/*!100100 SET @@SQL_MODE='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION' */;

CREATE TABLE dragon_riders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    dragon_count INT DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE dragons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    rider_id INT,
    FOREIGN KEY (rider_id) REFERENCES dragon_riders(id)
) ENGINE=InnoDB;`;

        const diagram = await sqlImportToDiagram({
            sqlContent: mariaDbSql,
            sourceDatabaseType: DatabaseType.MARIADB,
            targetDatabaseType: DatabaseType.GENERIC,
        });

        expect(diagram.tables).toHaveLength(2);
        expect(diagram.relationships).toHaveLength(1);

        // Check that tables are properly sorted
        expect(diagram.tables[0].name).toBe('dragon_riders');
        expect(diagram.tables[1].name).toBe('dragons');
    });
});
