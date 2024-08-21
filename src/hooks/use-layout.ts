import { useContext } from 'react';
import { layoutContext } from '@/context/layout-context/layout-context';

export const useLayout = () => useContext(layoutContext);
