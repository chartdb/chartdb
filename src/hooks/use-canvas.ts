import { useContext } from 'react';
import { canvasContext } from '@/context/canvas-context/canvas-context';

export const useCanvas = () => useContext(canvasContext);
