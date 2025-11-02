import { useContext } from 'react';
import { authContext } from '@/context/auth-context/auth-context';

export const useAuth = () => useContext(authContext);
