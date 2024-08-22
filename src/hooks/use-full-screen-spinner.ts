import { useContext } from 'react';
import { fullScreenLoaderContext } from '@/context/full-screen-spinner-context/full-screen-spinner-context';

export const useFullScreenLoader = () => useContext(fullScreenLoaderContext);
