import { useContext } from 'react';
import { LocalConfigContext } from '@/context/local-config-context/local-config-context';

export const useLocalConfig = () => useContext(LocalConfigContext);
