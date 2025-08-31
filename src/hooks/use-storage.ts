import { useContext } from 'react';
import { storageContext } from '@/context/storage-context/storage-context';

export const useStorage = () => useContext(storageContext);
