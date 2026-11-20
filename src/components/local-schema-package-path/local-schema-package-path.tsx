import React, { useCallback } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/button/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import { getLocalSchemaPackagePath } from '@/lib/local-schema-package';

export interface LocalSchemaPackagePathProps {
    diagramName?: string;
}

export const LocalSchemaPackagePath: React.FC<LocalSchemaPackagePathProps> = ({
    diagramName,
}) => {
    const packagePath = getLocalSchemaPackagePath(diagramName);

    const copyPath = useCallback(async () => {
        if (!packagePath || !navigator.clipboard) {
            return;
        }

        await navigator.clipboard.writeText(packagePath);
    }, [packagePath]);

    if (!import.meta.env.DEV || !packagePath) {
        return null;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    className="h-6 max-w-[220px] gap-1 px-1.5 text-xs font-normal text-muted-foreground hover:bg-muted/60"
                    onClick={copyPath}
                    aria-label={`Copy local package path ${packagePath}`}
                >
                    <span className="truncate">{packagePath}</span>
                    <Copy className="size-3" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>{packagePath}</TooltipContent>
        </Tooltip>
    );
};
