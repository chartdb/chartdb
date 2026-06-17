import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    sanitizeDiagramFileName,
    resolveSchemaFilePath,
    saveAutosavePayload,
    listLocalSchemaPackages,
    readLocalSchemaPackageDiagram,
} from '../dbml-autosave';

const root = path.resolve('/repo/schemas');

const makeTempRepo = () =>
    fs.mkdtempSync(path.join(os.tmpdir(), 'chartdb-autosave-'));

describe('sanitizeDiagramFileName', () => {
    it('lowercases and converts spaces to underscores', () => {
        expect(sanitizeDiagramFileName('Sample Schema')).toBe('sample_schema');
    });

    it('strips characters outside [a-z0-9_-]', () => {
        expect(sanitizeDiagramFileName('my diagram! (v2)')).toBe(
            'my_diagram_v2'
        );
    });
});

describe('resolveSchemaFilePath', () => {
    it('resolves a simple name inside the schemas root', () => {
        expect(resolveSchemaFilePath(root, 'Event Test', 'dbml')).toBe(
            path.join(root, 'event_test', 'schema.dbml')
        );
    });

    it('uses the requested package filename', () => {
        expect(resolveSchemaFilePath(root, 'Event Test', 'diagramJson')).toBe(
            path.join(root, 'event_test', 'diagram.chartdb.json')
        );
    });

    it('rejects path traversal', () => {
        expect(resolveSchemaFilePath(root, '../../etc/passwd', 'dbml')).toBe(
            null
        );
        expect(resolveSchemaFilePath(root, '..', 'dbml')).toBe(null);
    });

    it('rejects names containing path separators', () => {
        expect(resolveSchemaFilePath(root, 'a/b', 'dbml')).toBe(null);
        expect(resolveSchemaFilePath(root, 'a\\b', 'dbml')).toBe(null);
        expect(resolveSchemaFilePath(root, '/absolute', 'dbml')).toBe(null);
        expect(resolveSchemaFilePath(root, 'C:\\absolute', 'dbml')).toBe(null);
        expect(resolveSchemaFilePath(root, 'C:relative', 'dbml')).toBe(null);
    });

    it('rejects names that sanitize to nothing', () => {
        expect(resolveSchemaFilePath(root, '???', 'dbml')).toBe(null);
        expect(resolveSchemaFilePath(root, '', 'dbml')).toBe(null);
    });
});

describe('saveAutosavePayload', () => {
    it('writes DBML and diagram JSON into a package directory', () => {
        const repoRoot = makeTempRepo();

        try {
            expect(
                saveAutosavePayload(repoRoot, {
                    diagramName: 'Event Test',
                    dbml: 'Table users {}',
                    diagramJson: '{"tables":[]}',
                })
            ).toEqual([
                path.join('schemas', 'event_test', 'schema.dbml'),
                path.join('schemas', 'event_test', 'diagram.chartdb.json'),
            ]);

            expect(
                fs.readFileSync(
                    path.join(repoRoot, 'schemas/event_test/schema.dbml'),
                    'utf-8'
                )
            ).toBe('Table users {}');
            expect(
                fs.readFileSync(
                    path.join(
                        repoRoot,
                        'schemas/event_test/diagram.chartdb.json'
                    ),
                    'utf-8'
                )
            ).toBe('{"tables":[]}');
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });

    it('does not rewrite unchanged DBML content', () => {
        const repoRoot = makeTempRepo();
        const dbmlPath = path.join(repoRoot, 'schemas/event_test/schema.dbml');
        const oldTime = new Date('2020-01-01T00:00:00.000Z');

        try {
            saveAutosavePayload(repoRoot, {
                diagramName: 'Event Test',
                dbml: 'Table users {}',
            });
            fs.utimesSync(dbmlPath, oldTime, oldTime);

            saveAutosavePayload(repoRoot, {
                diagramName: 'Event Test',
                dbml: 'Table users {}',
            });

            expect(fs.statSync(dbmlPath).mtime.getTime()).toBe(
                oldTime.getTime()
            );
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });

    it('updates JSON-only saves without touching DBML', () => {
        const repoRoot = makeTempRepo();
        const dbmlPath = path.join(repoRoot, 'schemas/event_test/schema.dbml');
        const jsonPath = path.join(
            repoRoot,
            'schemas/event_test/diagram.chartdb.json'
        );
        const oldTime = new Date('2020-01-01T00:00:00.000Z');

        try {
            saveAutosavePayload(repoRoot, {
                diagramName: 'Event Test',
                dbml: 'Table users {}',
                diagramJson: '{"version":1}',
            });
            fs.utimesSync(dbmlPath, oldTime, oldTime);

            expect(
                saveAutosavePayload(repoRoot, {
                    diagramName: 'Event Test',
                    diagramJson: '{"version":2}',
                })
            ).toEqual([
                path.join('schemas', 'event_test', 'diagram.chartdb.json'),
            ]);

            expect(fs.statSync(dbmlPath).mtime.getTime()).toBe(
                oldTime.getTime()
            );
            expect(fs.readFileSync(jsonPath, 'utf-8')).toBe('{"version":2}');
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });

    it('does not delete legacy flat files', () => {
        const repoRoot = makeTempRepo();
        const schemasRoot = path.join(repoRoot, 'schemas');
        const legacyDbmlPath = path.join(schemasRoot, 'event_test.dbml');
        const legacyJsonPath = path.join(
            schemasRoot,
            'event_test.chartdb.json'
        );

        try {
            fs.mkdirSync(schemasRoot, { recursive: true });
            fs.writeFileSync(legacyDbmlPath, 'legacy dbml', 'utf-8');
            fs.writeFileSync(legacyJsonPath, 'legacy json', 'utf-8');

            saveAutosavePayload(repoRoot, {
                diagramName: 'Event Test',
                dbml: 'Table users {}',
                diagramJson: '{"tables":[]}',
            });

            expect(fs.readFileSync(legacyDbmlPath, 'utf-8')).toBe(
                'legacy dbml'
            );
            expect(fs.readFileSync(legacyJsonPath, 'utf-8')).toBe(
                'legacy json'
            );
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });
});

describe('listLocalSchemaPackages', () => {
    it('lists valid packages sorted by diagram JSON mtime', () => {
        const repoRoot = makeTempRepo();

        try {
            saveAutosavePayload(repoRoot, {
                diagramName: 'Older Diagram',
                dbml: 'Table older { id int }',
                diagramJson: JSON.stringify({
                    name: 'Older Diagram',
                    tables: [{ id: 't1' }],
                }),
            });
            saveAutosavePayload(repoRoot, {
                diagramName: 'Newer Diagram',
                diagramJson: JSON.stringify({
                    name: 'Newer Diagram',
                    tables: [{ id: 't1' }, { id: 't2' }],
                }),
            });

            const olderTime = new Date('2020-01-01T00:00:00.000Z');
            const newerTime = new Date('2020-01-02T00:00:00.000Z');
            fs.utimesSync(
                path.join(
                    repoRoot,
                    'schemas/older_diagram/diagram.chartdb.json'
                ),
                olderTime,
                olderTime
            );
            fs.utimesSync(
                path.join(
                    repoRoot,
                    'schemas/newer_diagram/diagram.chartdb.json'
                ),
                newerTime,
                newerTime
            );

            expect(listLocalSchemaPackages(repoRoot)).toMatchObject([
                {
                    packageName: 'newer_diagram',
                    diagramName: 'Newer Diagram',
                    relativePath: 'schemas/newer_diagram/',
                    diagramJsonPath:
                        'schemas/newer_diagram/diagram.chartdb.json',
                    hasDbml: false,
                    tablesCount: 2,
                },
                {
                    packageName: 'older_diagram',
                    diagramName: 'Older Diagram',
                    relativePath: 'schemas/older_diagram/',
                    diagramJsonPath:
                        'schemas/older_diagram/diagram.chartdb.json',
                    schemaPath: 'schemas/older_diagram/schema.dbml',
                    hasDbml: true,
                    tablesCount: 1,
                },
            ]);
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });

    it('omits malformed, incomplete, and unsafe package directories', () => {
        const repoRoot = makeTempRepo();

        try {
            fs.mkdirSync(path.join(repoRoot, 'schemas/valid'), {
                recursive: true,
            });
            fs.writeFileSync(
                path.join(repoRoot, 'schemas/valid/diagram.chartdb.json'),
                JSON.stringify({ name: 'Valid', tables: [] }),
                'utf-8'
            );
            fs.mkdirSync(path.join(repoRoot, 'schemas/malformed'), {
                recursive: true,
            });
            fs.writeFileSync(
                path.join(repoRoot, 'schemas/malformed/diagram.chartdb.json'),
                '{nope',
                'utf-8'
            );
            fs.mkdirSync(path.join(repoRoot, 'schemas/incomplete'), {
                recursive: true,
            });
            fs.mkdirSync(path.join(repoRoot, 'schemas/Unsafe Name'), {
                recursive: true,
            });
            fs.writeFileSync(
                path.join(repoRoot, 'schemas/Unsafe Name/diagram.chartdb.json'),
                JSON.stringify({ name: 'Unsafe Name', tables: [] }),
                'utf-8'
            );

            expect(
                listLocalSchemaPackages(repoRoot).map(
                    (schemaPackage) => schemaPackage.packageName
                )
            ).toEqual(['valid']);
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });
});

describe('readLocalSchemaPackageDiagram', () => {
    it('reads the selected package diagram JSON', () => {
        const repoRoot = makeTempRepo();
        const diagramJson = JSON.stringify({ name: 'Event Test', notes: [] });

        try {
            saveAutosavePayload(repoRoot, {
                diagramName: 'Event Test',
                diagramJson,
            });

            expect(readLocalSchemaPackageDiagram(repoRoot, 'event_test')).toBe(
                diagramJson
            );
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });

    it('rejects package traversal and unknown packages', () => {
        const repoRoot = makeTempRepo();

        try {
            expect(() =>
                readLocalSchemaPackageDiagram(repoRoot, '../event_test')
            ).toThrow('invalid package name');
            expect(() =>
                readLocalSchemaPackageDiagram(repoRoot, 'missing')
            ).toThrow('package diagram JSON not found');
        } finally {
            fs.rmSync(repoRoot, { recursive: true, force: true });
        }
    });
});
