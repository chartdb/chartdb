import { describe, it, expect } from 'vitest';
import { diagramFromJSONInput } from '@/lib/export-import-utils';
import { generateDBMLFromDiagram } from '../dbml-export';
import * as fs from 'fs';
import * as path from 'path';

const testCase = (caseNumber: string) => {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'cases', `${caseNumber}.json`);
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');

    // Parse the JSON and convert to diagram
    const diagram = diagramFromJSONInput(jsonContent);

    // Generate DBML from the diagram
    const result = generateDBMLFromDiagram(diagram);

    // Check for both regular and inline DBML files
    const regularDbmlPath = path.join(__dirname, 'cases', `${caseNumber}.dbml`);
    const inlineDbmlPath = path.join(
        __dirname,
        'cases',
        `${caseNumber}.inline.dbml`
    );

    const hasRegularDbml = fs.existsSync(regularDbmlPath);
    const hasInlineDbml = fs.existsSync(inlineDbmlPath);

    // Test regular DBML if file exists
    if (hasRegularDbml) {
        const expectedRegularDBML = fs.readFileSync(regularDbmlPath, 'utf-8');
        expect(result.standardDbml).toBe(expectedRegularDBML);
    }

    // Test inline DBML if file exists
    if (hasInlineDbml) {
        const expectedInlineDBML = fs.readFileSync(inlineDbmlPath, 'utf-8');
        expect(result.inlineDbml).toBe(expectedInlineDBML);
    }

    // Ensure at least one DBML file exists
    if (!hasRegularDbml && !hasInlineDbml) {
        throw new Error(
            `No DBML file found for test case ${caseNumber}. Expected either ${caseNumber}.dbml or ${caseNumber}.inline.dbml`
        );
    }
};

describe('DBML Export cases', () => {
    it('should handle case 1 diagram', { timeout: 30000 }, async () => {
        testCase('1');
    });

    it('should handle case 2 diagram', { timeout: 30000 }, async () => {
        testCase('2');
    });

    it('should handle case 3 diagram', { timeout: 30000 }, async () => {
        testCase('3');
    });

    it('should handle case 4 diagram', { timeout: 30000 }, async () => {
        testCase('4');
    });

    it('should handle case 5 diagram', { timeout: 30000 }, async () => {
        testCase('5');
    });

    it(
        'should handle case 6 diagram - auto increment',
        { timeout: 30000 },
        async () => {
            testCase('6');
        }
    );

    it('should handle case 7 diagram', { timeout: 30000 }, async () => {
        testCase('7');
    });

    it('should handle case 8 diagram', { timeout: 30000 }, async () => {
        testCase('8');
    });
});
