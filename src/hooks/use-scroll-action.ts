import { ScrollContext } from '@/context/scroll-context/scroll-context';
import { useContext } from 'react';

export const useScrollAction = () => useContext(ScrollContext);
