import { useContext } from 'react';
import { diagramFilterContext } from './diagram-filter-context';

export const useDiagramFilter = () => useContext(diagramFilterContext);
