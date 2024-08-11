import { chartDBContext } from '@/context/chartdb-context/chartdb-context';
import { useContext } from 'react';

export const useChartDB = () => useContext(chartDBContext);
