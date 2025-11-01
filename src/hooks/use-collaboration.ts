import { useContext } from 'react';
import { collaborationContext } from '@/context/collaboration-context/collaboration-context';

export const useCollaboration = () => useContext(collaborationContext);
