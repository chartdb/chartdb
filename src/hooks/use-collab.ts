import { useContext } from 'react';
import { collabContext } from '@/context/collab-context/collab-context';

export const useCollab = () => useContext(collabContext);
