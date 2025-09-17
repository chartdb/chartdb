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
    const generatedDBML = result.standardDbml;

    // Read the expected DBML file
    const dbmlPath = path.join(__dirname, 'cases', `${caseNumber}.dbml`);
    const expectedDBML = fs.readFileSync(dbmlPath, 'utf-8');

    // Compare the generated DBML with the expected DBML
    expect(generatedDBML).toBe(expectedDBML);
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
});
