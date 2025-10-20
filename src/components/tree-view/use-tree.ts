import type { Dispatch, SetStateAction } from 'react';
import { useState, useCallback, useMemo } from 'react';
import type { TreeNode, FetchChildrenFunction } from './tree';

export interface ExpandedState {
    [key: string]: boolean;
}

interface LoadingState {
    [key: string]: boolean;
}

interface LoadedChildren<
    Type extends string,
    Context extends Record<Type, unknown>,
> {
    [key: string]: TreeNode<Type, Context>[];
}

interface HasMoreChildrenState {
    [key: string]: boolean;
}

export function useTree<
    Type extends string,
    Context extends Record<Type, unknown>,
>({
    fetchChildren,
    expanded: expandedProp,
    setExpanded: setExpandedProp,
    disableCache = false,
}: {
    fetchChildren?: FetchChildrenFunction<Type, Context>;
    expanded?: ExpandedState;
    setExpanded?: Dispatch<SetStateAction<ExpandedState>>;
    disableCache?: boolean;
}) {
    const [expandedInternal, setExpandedInternal] = useState<ExpandedState>({});

    const expanded = useMemo(
        () => expandedProp ?? expandedInternal,
        [expandedProp, expandedInternal]
    );
    const setExpanded = useCallback(
        (value: SetStateAction<ExpandedState>) => {
            if (setExpandedProp) {
                setExpandedProp(value);
            } else {
                setExpandedInternal(value);
            }
        },
        [setExpandedProp, setExpandedInternal]
    );

    const [loading, setLoading] = useState<LoadingState>({});
    const [loadedChildren, setLoadedChildren] = useState<
        LoadedChildren<Type, Context>
    >({});
    const [hasMoreChildren, setHasMoreChildren] =
        useState<HasMoreChildrenState>({});

    const mergeChildren = useCallback(
        (
            staticChildren: TreeNode<Type, Context>[] = [],
            fetchedChildren: TreeNode<Type, Context>[] = []
        ) => {
            const fetchedChildrenIds = new Set(
                fetchedChildren.map((child) => child.id)
            );
            const uniqueStaticChildren = staticChildren.filter(
                (child) => !fetchedChildrenIds.has(child.id)
            );
            return [...uniqueStaticChildren, ...fetchedChildren];
        },
        []
    );

    const toggleNode = useCallback(
        async (
            nodeId: string,
            nodeType: Type,
            nodeContext: Context[Type],
            staticChildren?: TreeNode<Type, Context>[]
        ) => {
            if (expanded[nodeId]) {
                // If we're collapsing, just update expanded state
                setExpanded((prev) => ({ ...prev, [nodeId]: false }));
                return;
            }

            // Get any previously fetched children
            const previouslyFetchedChildren = loadedChildren[nodeId] || [];

            // Only cache if caching is enabled
            if (!disableCache && staticChildren?.length) {
                const mergedChildren = mergeChildren(
                    staticChildren,
                    previouslyFetchedChildren
                );
                setLoadedChildren((prev) => ({
                    ...prev,
                    [nodeId]: mergedChildren,
                }));

                // Only show "more loading" if we haven't fetched children before
                setHasMoreChildren((prev) => ({
                    ...prev,
                    [nodeId]: !previouslyFetchedChildren.length,
                }));
            }

            // Set expanded state immediately to show static/previously fetched children
            setExpanded((prev) => ({ ...prev, [nodeId]: true }));

            // If we haven't loaded dynamic children yet and cache is enabled
            if (!disableCache && !previouslyFetchedChildren.length) {
                setLoading((prev) => ({ ...prev, [nodeId]: true }));
                try {
                    const fetchedChildren = await fetchChildren?.(
                        nodeId,
                        nodeType,
                        nodeContext
                    );
                    // Merge static and newly fetched children
                    const allChildren = mergeChildren(
                        staticChildren || [],
                        fetchedChildren
                    );

                    setLoadedChildren((prev) => ({
                        ...prev,
                        [nodeId]: allChildren,
                    }));
                    setHasMoreChildren((prev) => ({
                        ...prev,
                        [nodeId]: false,
                    }));
                } catch (error) {
                    console.error('Error loading children:', error);
                } finally {
                    setLoading((prev) => ({ ...prev, [nodeId]: false }));
                }
            }
        },
        [
            expanded,
            loadedChildren,
            fetchChildren,
            mergeChildren,
            setExpanded,
            disableCache,
        ]
    );

    return {
        expanded,
        loading,
        loadedChildren,
        hasMoreChildren,
        toggleNode,
    };
}
