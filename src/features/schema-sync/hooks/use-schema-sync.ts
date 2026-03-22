import { useContext } from 'react';
import { SchemaSyncContext } from '../context/schema-sync-context-object';

export const useSchemaSync = () => {
    const context = useContext(SchemaSyncContext);
    if (!context) {
        throw new Error('useSchemaSync must be used within SchemaSyncProvider');
    }
    return context;
};
