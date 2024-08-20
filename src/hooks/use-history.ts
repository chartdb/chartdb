import { useContext } from 'react';
import { historyContext } from '@/context/history-context/history-context';

export const useHistory = () => useContext(historyContext);
