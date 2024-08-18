import { useContext } from 'react';
import { ConfigContext } from '@/context/config-context/config-context';

export const useConfig = () => useContext(ConfigContext);
