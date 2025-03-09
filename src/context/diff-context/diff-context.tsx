import { createContext } from 'react';
import type { DiffMap } from './types';
import type { Diagram } from '@/lib/domain/diagram';

export interface DiffContext {
    diffMap: DiffMap;
    calculateDiff: ({
        diagram,
        newDiagram,
    }: {
        diagram: Diagram;
        newDiagram: Diagram;
    }) => void;
}

export const diffContext = createContext<DiffContext | undefined>(undefined);
