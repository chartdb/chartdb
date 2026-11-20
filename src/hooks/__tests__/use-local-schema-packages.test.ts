import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { DatabaseType } from '@/lib/domain/database-type';
import { useLocalSchemaPackages } from '../use-local-schema-packages';

const addDiagramMock = vi.fn();
const updateConfigMock = vi.fn();
const closeOpenDiagramDialogMock = vi.fn();
const navigateMock = vi.fn();

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({ addDiagram: addDiagramMock }),
}));

vi.mock('@/hooks/use-config', () => ({
    useConfig: () => ({ updateConfig: updateConfigMock }),
}));

vi.mock('@/hooks/use-dialog', () => ({
    useDialog: () => ({ closeOpenDiagramDialog: closeOpenDiagramDialogMock }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

const packageMetadata = {
    packageName: 'sample_schema',
    diagramName: 'Sample Schema',
    relativePath: 'schemas/sample_schema/',
    diagramJsonPath: 'schemas/sample_schema/diagram.chartdb.json',
    schemaPath: 'schemas/sample_schema/schema.dbml',
    absolutePath: '/repo/schemas/sample_schema',
    updatedAt: '2026-06-11T00:00:00.000Z',
    hasDbml: true,
    tablesCount: 1,
};

describe('useLocalSchemaPackages', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);
        addDiagramMock.mockResolvedValue(undefined);
        updateConfigMock.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    it('fetches local schema package metadata', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ packages: [packageMetadata] }),
        });

        const { result } = renderHook(() => useLocalSchemaPackages());

        await act(async () => {
            await result.current.refreshPackages();
        });

        expect(fetchMock).toHaveBeenCalledWith('/api/local-schema-packages');
        expect(result.current.packages).toEqual([packageMetadata]);
        expect(result.current.isUnavailable).toBe(false);
    });

    it('keeps failures quiet and marks packages unavailable', async () => {
        fetchMock.mockRejectedValue(new Error('missing endpoint'));

        const { result } = renderHook(() => useLocalSchemaPackages());

        await act(async () => {
            await result.current.refreshPackages();
        });

        expect(result.current.packages).toEqual([]);
        expect(result.current.isUnavailable).toBe(true);
    });

    it('opens a local package through the existing JSON import path', async () => {
        const diagramJson = JSON.stringify({
            id: 'diagram-1',
            name: 'Sample Schema',
            databaseType: DatabaseType.GENERIC,
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
            tables: [],
            areas: [
                {
                    id: 'area-1',
                    name: 'Area',
                    x: 1,
                    y: 2,
                    width: 300,
                    height: 200,
                    color: '#8eb7ff',
                },
            ],
            customTypes: [],
            notes: [
                {
                    id: 'note-1',
                    content: 'Important note',
                    x: 10,
                    y: 20,
                    width: 200,
                    height: 120,
                    color: '#ffe374',
                },
            ],
        });
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ diagramJson }),
        });

        const { result } = renderHook(() => useLocalSchemaPackages());

        await act(async () => {
            await result.current.openPackage(packageMetadata);
        });

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/local-schema-packages/sample_schema/diagram'
        );
        expect(addDiagramMock).toHaveBeenCalledTimes(1);
        const importedDiagram = addDiagramMock.mock.calls[0][0].diagram;
        expect(importedDiagram.name).toBe('Sample Schema');
        expect(importedDiagram.notes).toEqual([
            expect.objectContaining({
                content: 'Important note',
                x: 10,
                y: 20,
                width: 200,
                height: 120,
                color: '#ffe374',
            }),
        ]);
        expect(updateConfigMock).toHaveBeenCalledWith({
            config: { defaultDiagramId: importedDiagram.id },
        });
        expect(closeOpenDiagramDialogMock).toHaveBeenCalled();
        expect(navigateMock).toHaveBeenCalledWith(
            `/diagrams/${importedDiagram.id}`
        );
    });
});
