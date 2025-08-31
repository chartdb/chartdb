import { dialogContext } from '@/context/dialog-context/dialog-context';
import { useContext } from 'react';

export const useDialog = () => useContext(dialogContext);
