import React from 'react';
import { Button } from '@/components/button/button';
import { DatabaseZap } from 'lucide-react';
import { useSchemaSync } from '../hooks/use-schema-sync';

export const SchemaSyncToolbarButton: React.FC = () => {
    const { setOpen } = useSchemaSync();

    return (
        <Button
            variant="outline"
            size="sm"
            className="h-8 gap-2 text-xs"
            onClick={() => setOpen(true)}
        >
            <DatabaseZap className="size-4" />
            Schema Sync
        </Button>
    );
};
