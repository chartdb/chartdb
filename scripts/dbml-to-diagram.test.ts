/**
 * Converts a DBML file into a ChartDB diagram JSON, importable via
 * File → Import diagram in the app.
 *
 * Runs through vitest so it can reuse the app's own importer (path
 * aliases, browser-ish env). Skipped unless DBML_FILE is set, so it
 * never runs as part of the normal test suite.
 *
 * Usage:
 *   DBML_FILE=schemas/sample_schema.dbml npx vitest run scripts/dbml-to-diagram.test.ts
 *
 * Optional:
 *   DIAGRAM_NAME="My Diagram"   # defaults to the DBML filename
 *
 * Output: <input>.chartdb.json next to the input file.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { importDBMLToDiagram } from '@/lib/dbml/dbml-import/dbml-import';
import { diagramToJSONOutput } from '@/lib/export-import-utils';
import { DatabaseType } from '@/lib/domain/database-type';

const dbmlFile = process.env.DBML_FILE;

describe.runIf(!!dbmlFile)('dbml-to-diagram converter', () => {
    it('converts the DBML file to a ChartDB diagram JSON', async () => {
        const inputPath = path.resolve(dbmlFile!);
        const dbmlContent = readFileSync(inputPath, 'utf-8');

        const diagram = await importDBMLToDiagram(dbmlContent, {
            databaseType: DatabaseType.GENERIC,
        });

        diagram.name =
            process.env.DIAGRAM_NAME ??
            path.basename(inputPath).replace(/\.dbml$/i, '');

        expect(diagram.tables?.length ?? 0).toBeGreaterThan(0);

        const outputPath = inputPath.replace(/\.dbml$/i, '.chartdb.json');
        writeFileSync(outputPath, diagramToJSONOutput(diagram));
        console.log(
            `Wrote ${outputPath} (${diagram.tables?.length} tables, ${diagram.relationships?.length} relationships)`
        );
    });
});
