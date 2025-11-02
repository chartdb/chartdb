import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useLayout } from '@/hooks/use-layout';
import { useBreakpoint } from '@/hooks/use-breakpoint';

interface FocusOptions {
    select?: boolean;
}

export const useFocusOn = () => {
    const { fitView, setNodes, setEdges } = useReactFlow();
    const { hideSidePanel } = useLayout();
    const { isMd: isDesktop } = useBreakpoint('md');

    const focusOnArea = useCallback(
        (areaId: string, options: FocusOptions = {}) => {
            const { select = true } = options;

            if (select) {
                setNodes((nodes) =>
                    nodes.map((node) =>
                        node.id === areaId
                            ? {
                                  ...node,
                                  selected: true,
                              }
                            : {
                                  ...node,
                                  selected: false,
                              }
                    )
                );
            }

            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    {
                        id: areaId,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [fitView, setNodes, hideSidePanel, isDesktop]
    );

    const focusOnTable = useCallback(
        (tableId: string, options: FocusOptions = {}) => {
            const { select = true } = options;

            if (select) {
                setNodes((nodes) =>
                    nodes.map((node) =>
                        node.id === tableId
                            ? {
                                  ...node,
                                  selected: true,
                              }
                            : {
                                  ...node,
                                  selected: false,
                              }
                    )
                );
            }

            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    {
                        id: tableId,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [fitView, setNodes, hideSidePanel, isDesktop]
    );

    const focusOnNote = useCallback(
        (noteId: string, options: FocusOptions = {}) => {
            const { select = true } = options;

            if (select) {
                setNodes((nodes) =>
                    nodes.map((node) =>
                        node.id === noteId
                            ? {
                                  ...node,
                                  selected: true,
                              }
                            : {
                                  ...node,
                                  selected: false,
                              }
                    )
                );
            }

            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    {
                        id: noteId,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [fitView, setNodes, hideSidePanel, isDesktop]
    );

    const focusOnRelationship = useCallback(
        (
            relationshipId: string,
            sourceTableId: string,
            targetTableId: string,
            options: FocusOptions = {}
        ) => {
            const { select = true } = options;

            if (select) {
                setEdges((edges) =>
                    edges.map((edge) =>
                        edge.id === relationshipId
                            ? {
                                  ...edge,
                                  selected: true,
                              }
                            : {
                                  ...edge,
                                  selected: false,
                              }
                    )
                );
            }

            fitView({
                duration: 500,
                maxZoom: 1,
                minZoom: 1,
                nodes: [
                    {
                        id: sourceTableId,
                    },
                    {
                        id: targetTableId,
                    },
                ],
            });

            if (!isDesktop) {
                hideSidePanel();
            }
        },
        [fitView, setEdges, hideSidePanel, isDesktop]
    );

    return {
        focusOnArea,
        focusOnTable,
        focusOnNote,
        focusOnRelationship,
    };
};
