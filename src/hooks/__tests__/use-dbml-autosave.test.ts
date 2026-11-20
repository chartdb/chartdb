import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDbmlAutosave } from '../use-dbml-autosave';
import type { Diagram } from '@/lib/domain/diagram';
import { DatabaseType } from '@/lib/domain/database-type';

const makeDiagram = (updatedAt: number, id = 'd1'): Diagram => ({
    id,
    name: 'Test Diagram',
    databaseType: DatabaseType.GENERIC,
    createdAt: new Date(0),
    updatedAt: new Date(updatedAt),
});

const chartDBState = {
    currentDiagram: makeDiagram(0),
    diagramName: 'Test Diagram',
    diagramId: 'd1',
};

const toastMock = vi.fn();
const generateDBMLMock = vi.fn();

vi.mock('@/hooks/use-chartdb', () => ({
    useChartDB: () => chartDBState,
}));
vi.mock('@/components/toast/use-toast', () => ({
    useToast: () => ({ toast: toastMock }),
}));
vi.mock('@/lib/dbml/dbml-export/dbml-export', () => ({
    generateDBMLFromDiagram: (...args: unknown[]) => generateDBMLMock(...args),
}));

const setDiagram = (updatedAt: number, id = 'd1') => {
    chartDBState.currentDiagram = makeDiagram(updatedAt, id);
    chartDBState.diagramId = id;
};

describe('useDbmlAutosave', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.useFakeTimers();
        fetchMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', fetchMock);
        generateDBMLMock.mockReturnValue({
            standardDbml: 'Table t { id int }',
            inlineDbml: '',
            relationshipsDbml: '',
        });
        setDiagram(0);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('does not save when a diagram is first loaded', async () => {
        renderHook(() => useDbmlAutosave());
        await vi.advanceTimersByTimeAsync(5000);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('saves DBML and JSON after an edit, debounced', async () => {
        const { rerender } = renderHook(() => useDbmlAutosave());
        setDiagram(1);
        rerender();

        await vi.advanceTimersByTimeAsync(1900);
        expect(fetchMock).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(200);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.diagramName).toBe('Test Diagram');
        expect(body.dbml).toBe('Table t { id int }');
        expect(JSON.parse(body.diagramJson).name).toBe('Test Diagram');
    });

    it('collapses a burst of edits into one save', async () => {
        const { rerender } = renderHook(() => useDbmlAutosave());
        for (let i = 1; i <= 5; i++) {
            setDiagram(i);
            rerender();
            await vi.advanceTimersByTimeAsync(500);
        }
        await vi.advanceTimersByTimeAsync(2500);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('omits dbml but still sends the JSON when generation fails', async () => {
        generateDBMLMock.mockReturnValue({
            standardDbml: '',
            inlineDbml: '',
            relationshipsDbml: '',
            error: 'boom',
        });
        const { rerender } = renderHook(() => useDbmlAutosave());
        setDiagram(1);
        rerender();
        await vi.advanceTimersByTimeAsync(2100);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const body = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(body.dbml).toBeUndefined();
        expect(body.diagramJson).toBeDefined();
    });

    it('disables itself and toasts once after the first failure', async () => {
        fetchMock.mockRejectedValue(new Error('network down'));
        const { rerender } = renderHook(() => useDbmlAutosave());
        setDiagram(1);
        rerender();
        await vi.advanceTimersByTimeAsync(2100);

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(toastMock).toHaveBeenCalledTimes(1);

        setDiagram(2);
        rerender();
        await vi.advanceTimersByTimeAsync(5000);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(toastMock).toHaveBeenCalledTimes(1);
    });

    it('ignores stale failed responses after a newer save starts', async () => {
        let rejectFirstSave: (error: Error) => void = () => {};
        fetchMock
            .mockImplementationOnce(
                () =>
                    new Promise((_resolve, reject) => {
                        rejectFirstSave = reject;
                    })
            )
            .mockResolvedValue({ ok: true });

        const { rerender } = renderHook(() => useDbmlAutosave());
        setDiagram(1);
        rerender();
        await vi.advanceTimersByTimeAsync(2100);
        expect(fetchMock).toHaveBeenCalledTimes(1);

        setDiagram(2);
        rerender();
        await vi.advanceTimersByTimeAsync(2100);
        expect(fetchMock).toHaveBeenCalledTimes(2);

        rejectFirstSave(new Error('stale failure'));
        await vi.runAllTicks();

        setDiagram(3);
        rerender();
        await vi.advanceTimersByTimeAsync(2100);

        expect(toastMock).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('does not save when switching to another diagram', async () => {
        const { rerender } = renderHook(() => useDbmlAutosave());
        setDiagram(5, 'd2');
        rerender();
        await vi.advanceTimersByTimeAsync(5000);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
