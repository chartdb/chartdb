import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DatabaseType } from '@/lib/domain/database-type';
import type { Diagram } from '@/lib/domain/diagram';
import type { LocalSchemaPackageMetadata } from '@/lib/local-schema-package';
import { OpenDiagramDialog } from '../open-diagram-dialog';
import { shouldRenderLocalSchemaPackages } from '../open-diagram-dialog-utils';

const testState = vi.hoisted(() => ({
    listDiagrams: vi.fn(),
    refreshPackages: vi.fn(),
    openPackage: vi.fn(),
    closeOpenDiagramDialog: vi.fn(),
    openCreateDiagramDialog: vi.fn(),
    updateConfig: vi.fn(),
    navigate: vi.fn(),
    localPackages: [] as LocalSchemaPackageMetadata[],
    isLoadingLocalPackages: false,
    areLocalPackagesUnavailable: false,
}));

vi.mock('@/components/dialog/dialog', () => ({
    Dialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    DialogClose: ({ children }: { children: React.ReactNode }) => (
        <>{children}</>
    ),
    DialogContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogDescription: ({ children }: { children: React.ReactNode }) => (
        <p>{children}</p>
    ),
    DialogFooter: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogHeader: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogInternalContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DialogTitle: ({ children }: { children: React.ReactNode }) => (
        <h2>{children}</h2>
    ),
}));

vi.mock('@/components/diagram-icon/diagram-icon', () => ({
    DiagramIcon: () => <span data-testid="diagram-icon" />,
}));

vi.mock('../diagram-row-actions-menu/diagram-row-actions-menu', () => ({
    DiagramRowActionsMenu: () => <button type="button">Actions</button>,
}));

vi.mock('@/hooks/use-storage', () => ({
    useStorage: () => ({ listDiagrams: testState.listDiagrams }),
}));

vi.mock('@/hooks/use-local-schema-packages', () => ({
    useLocalSchemaPackages: () => ({
        packages: testState.localPackages,
        isLoading: testState.isLoadingLocalPackages,
        isUnavailable: testState.areLocalPackagesUnavailable,
        refreshPackages: testState.refreshPackages,
        openPackage: testState.openPackage,
    }),
}));

vi.mock('@/hooks/use-dialog', () => ({
    useDialog: () => ({
        closeOpenDiagramDialog: testState.closeOpenDiagramDialog,
        openCreateDiagramDialog: testState.openCreateDiagramDialog,
    }),
}));

vi.mock('@/hooks/use-config', () => ({
    useConfig: () => ({ updateConfig: testState.updateConfig }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: () => testState.navigate,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) =>
            ({
                'open_diagram_dialog.title': 'Open Database',
                'open_diagram_dialog.description': 'Choose a database',
                'open_diagram_dialog.table_columns.name': 'Name',
                'open_diagram_dialog.table_columns.created_at': 'Created',
                'open_diagram_dialog.table_columns.last_modified':
                    'Last modified',
                'open_diagram_dialog.table_columns.tables_count': 'Tables',
                'open_diagram_dialog.cancel': 'Cancel',
                'open_diagram_dialog.new_database': 'New database',
                'open_diagram_dialog.open': 'Open',
            })[key] ?? key,
    }),
}));

const browserDiagram: Diagram = {
    id: 'browser-diagram',
    name: 'Browser Diagram',
    databaseType: DatabaseType.GENERIC,
    createdAt: new Date('2026-06-10T00:00:00.000Z'),
    updatedAt: new Date('2026-06-10T01:00:00.000Z'),
    tables: [],
    relationships: [],
    dependencies: [],
    areas: [],
    customTypes: [],
    notes: [],
};

const localPackage: LocalSchemaPackageMetadata = {
    packageName: 'sample_schema',
    diagramName: 'Sample Schema',
    relativePath: 'schemas/sample_schema/',
    diagramJsonPath: 'schemas/sample_schema/diagram.chartdb.json',
    schemaPath: 'schemas/sample_schema/schema.dbml',
    absolutePath: '/repo/schemas/sample_schema',
    updatedAt: '2026-06-11T00:00:00.000Z',
    hasDbml: true,
    tablesCount: 4,
};

describe('OpenDiagramDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        testState.listDiagrams.mockResolvedValue([browserDiagram]);
        testState.localPackages = [localPackage];
        testState.isLoadingLocalPackages = false;
        testState.areLocalPackagesUnavailable = false;
    });

    it('renders local schema packages before browser-local diagrams', async () => {
        render(<OpenDiagramDialog dialog={{ open: true }} />);

        await screen.findByText('Browser Diagram');

        const localHeader = screen.getByText('Local schemas');
        const browserHeader = screen.getByText('This browser');

        expect(screen.getByText('Sample Schema')).toBeInTheDocument();
        expect(screen.getByText('schemas/sample_schema/')).toBeInTheDocument();
        expect(
            localHeader.compareDocumentPosition(browserHeader) &
                Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(testState.refreshPackages).toHaveBeenCalled();
    });

    it('keeps browser-local diagrams available when local discovery is unavailable', async () => {
        testState.localPackages = [];
        testState.areLocalPackagesUnavailable = true;

        render(<OpenDiagramDialog dialog={{ open: true }} />);

        await screen.findByText('Browser Diagram');

        expect(screen.queryByText('Local schemas')).not.toBeInTheDocument();
        expect(screen.queryByText('Sample Schema')).not.toBeInTheDocument();
        expect(screen.getByText('Browser Diagram')).toBeInTheDocument();
    });

    it('does not render the local section outside development', () => {
        expect(
            shouldRenderLocalSchemaPackages({
                isDev: false,
                isUnavailable: false,
                isLoading: false,
                packagesCount: 1,
            })
        ).toBe(false);
    });

    it('shows local loading without blocking browser-local diagrams', async () => {
        testState.localPackages = [];
        testState.isLoadingLocalPackages = true;

        render(<OpenDiagramDialog dialog={{ open: true }} />);

        await waitFor(() => {
            expect(screen.getByText('Browser Diagram')).toBeInTheDocument();
        });
        expect(
            screen.getByText('Loading local packages...')
        ).toBeInTheDocument();
    });
});
