import { useContext } from 'react';
import { dataContext } from '@/context/data-context/data-context';

export const useData = () => useContext(dataContext);
