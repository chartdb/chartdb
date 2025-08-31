import { useContext } from 'react';
import { exportImageContext } from '@/context/export-image-context/export-image-context';

export const useExportImage = () => useContext(exportImageContext);
