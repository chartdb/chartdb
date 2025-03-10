import { useCallback, useState } from 'react';
import { getTableDimensions } from '../canvas-utils';
import type { TableNodeType } from '../table-node/table-node';
import { useOnViewportChange, useReactFlow } from '@xyflow/react';
import { useDebounce } from '@/hooks/use-debounce-v2';

export const useIsLostInCanvas = () => {
    const { getNodes, getViewport } = useReactFlow();
    const [noTablesVisible, setNoTablesVisible] = useState<boolean>(false);

    // Check if any tables are visible in the current viewport
    const checkVisibleTables = useCallback(() => {
        const nodes = getNodes();
        const viewport = getViewport();

        // If there are no nodes at all, don't highlight the button
        if (nodes.length === 0) {
            setNoTablesVisible(false);
            return;
        }

        // Count visible (not hidden) nodes
        const visibleNodes = nodes.filter((node) => !node.hidden);

        // If there are no visible nodes at all, don't highlight the button
        if (visibleNodes.length === 0) {
            setNoTablesVisible(false);
            return;
        }

        // Calculate viewport boundaries
        const viewportLeft = -viewport.x / viewport.zoom;
        const viewportTop = -viewport.y / viewport.zoom;

        const width =
            document.getElementById('canvas')?.clientWidth || window.innerWidth;
        const height =
            document.getElementById('canvas')?.clientHeight ||
            window.innerHeight;

        const viewportRight = viewportLeft + width / viewport.zoom;
        const viewportBottom = viewportTop + height / viewport.zoom;

        // Check if any node is visible in the viewport
        const anyNodeVisible = visibleNodes.some((node) => {
            let nodeWidth = node.width || 0;
            let nodeHeight = node.height || 0;

            if (node.type === 'table' && node.data?.table) {
                const tableNodeType = node as TableNodeType;
                const dimensions = getTableDimensions(tableNodeType.data.table);
                nodeWidth = dimensions.width;
                nodeHeight = dimensions.height;
            }

            // Node boundaries
            const nodeLeft = node.position.x;
            const nodeTop = node.position.y;
            const nodeRight = nodeLeft + nodeWidth;
            const nodeBottom = nodeTop + nodeHeight;

            return (
                nodeRight >= viewportLeft &&
                nodeLeft <= viewportRight &&
                nodeBottom >= viewportTop &&
                nodeTop <= viewportBottom
            );
        });

        // Only set to true if there are tables but none are visible
        setNoTablesVisible(!anyNodeVisible);
    }, [getNodes, getViewport]);

    // Create a debounced version of checkVisibleTables
    const debouncedCheckVisibleTables = useDebounce(checkVisibleTables, 1000);

    useOnViewportChange({
        onEnd: () => {
            debouncedCheckVisibleTables();
        },
    });

    return {
        isLostInCanvas: noTablesVisible,
    };
};
