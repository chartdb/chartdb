import {
    ChevronRight,
    File,
    Folder,
    Loader2,
    type LucideIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button/button';
import type {
    TreeNode,
    FetchChildrenFunction,
    SelectableTreeProps,
} from './tree';
import type { ExpandedState } from './use-tree';
import { useTree } from './use-tree';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { TreeItemSkeleton } from './tree-item-skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';

interface TreeViewProps<
    Type extends string,
    Context extends Record<Type, unknown>,
> {
    data: TreeNode<Type, Context>[];
    fetchChildren?: FetchChildrenFunction<Type, Context>;
    onNodeClick?: (node: TreeNode<Type, Context>) => void;
    className?: string;
    defaultIcon?: LucideIcon;
    defaultFolderIcon?: LucideIcon;
    defaultIconProps?: React.ComponentProps<LucideIcon>;
    defaultFolderIconProps?: React.ComponentProps<LucideIcon>;
    selectable?: SelectableTreeProps<Type, Context>;
    expanded?: ExpandedState;
    setExpanded?: Dispatch<SetStateAction<ExpandedState>>;
    renderHoverComponent?: (node: TreeNode<Type, Context>) => ReactNode;
    renderActionsComponent?: (node: TreeNode<Type, Context>) => ReactNode;
    loadingNodeIds?: string[];
    disableCache?: boolean;
}

export function TreeView<
    Type extends string,
    Context extends Record<Type, unknown>,
>({
    data,
    fetchChildren,
    onNodeClick,
    className,
    defaultIcon = File,
    defaultFolderIcon = Folder,
    defaultIconProps,
    defaultFolderIconProps,
    selectable,
    expanded: expandedProp,
    setExpanded: setExpandedProp,
    renderHoverComponent,
    renderActionsComponent,
    loadingNodeIds,
    disableCache = false,
}: TreeViewProps<Type, Context>) {
    const { expanded, loading, loadedChildren, hasMoreChildren, toggleNode } =
        useTree({
            fetchChildren,
            expanded: expandedProp,
            setExpanded: setExpandedProp,
            disableCache,
        });
    const [selectedIdInternal, setSelectedIdInternal] = React.useState<
        string | undefined
    >(selectable?.defaultSelectedId);

    const selectedId = useMemo(() => {
        return selectable?.selectedId ?? selectedIdInternal;
    }, [selectable?.selectedId, selectedIdInternal]);

    const setSelectedId = useCallback(
        (value: SetStateAction<string | undefined>) => {
            if (selectable?.setSelectedId) {
                selectable.setSelectedId(value);
            } else {
                setSelectedIdInternal(value);
            }
        },
        [selectable, setSelectedIdInternal]
    );

    useEffect(() => {
        if (selectable?.enabled && selectable.defaultSelectedId) {
            if (selectable.defaultSelectedId === selectedId) return;
            setSelectedId(selectable.defaultSelectedId);
            const { node, path } = findNodeById(
                data,
                selectable.defaultSelectedId
            );

            if (node) {
                selectable.onSelectedChange?.(node);

                // Expand all parent nodes
                for (const parent of path) {
                    if (expanded[parent.id]) continue;
                    toggleNode(
                        parent.id,
                        parent.type,
                        parent.context,
                        parent.children
                    );
                }
            }
        }
    }, [selectable, toggleNode, selectedId, data, expanded, setSelectedId]);

    const handleNodeSelect = (node: TreeNode<Type, Context>) => {
        if (selectable?.enabled) {
            setSelectedId(node.id);
            selectable.onSelectedChange?.(node);
        }
    };

    return (
        <div className={cn('w-full', className)}>
            {data.map((node, index) => (
                <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    expanded={expanded}
                    loading={loading}
                    loadedChildren={loadedChildren}
                    hasMoreChildren={hasMoreChildren}
                    onToggle={toggleNode}
                    onNodeClick={onNodeClick}
                    defaultIcon={defaultIcon}
                    defaultFolderIcon={defaultFolderIcon}
                    defaultIconProps={defaultIconProps}
                    defaultFolderIconProps={defaultFolderIconProps}
                    selectable={selectable?.enabled}
                    selectedId={selectedId}
                    onSelect={handleNodeSelect}
                    className={index > 0 ? 'mt-0.5' : ''}
                    renderHoverComponent={renderHoverComponent}
                    renderActionsComponent={renderActionsComponent}
                    loadingNodeIds={loadingNodeIds}
                    disableCache={disableCache}
                />
            ))}
        </div>
    );
}

interface TreeNodeProps<
    Type extends string,
    Context extends Record<Type, unknown>,
> {
    node: TreeNode<Type, Context>;
    level: number;
    expanded: Record<string, boolean>;
    loading: Record<string, boolean>;
    loadedChildren: Record<string, TreeNode<Type, Context>[]>;
    hasMoreChildren: Record<string, boolean>;
    onToggle: (
        nodeId: string,
        nodeType: Type,
        nodeContext: Context[Type],
        staticChildren?: TreeNode<Type, Context>[]
    ) => void;
    onNodeClick?: (node: TreeNode<Type, Context>) => void;
    defaultIcon: LucideIcon;
    defaultFolderIcon: LucideIcon;
    defaultIconProps?: React.ComponentProps<LucideIcon>;
    defaultFolderIconProps?: React.ComponentProps<LucideIcon>;
    selectable?: boolean;
    selectedId?: string;
    onSelect: (node: TreeNode<Type, Context>) => void;
    className?: string;
    renderHoverComponent?: (node: TreeNode<Type, Context>) => ReactNode;
    renderActionsComponent?: (node: TreeNode<Type, Context>) => ReactNode;
    loadingNodeIds?: string[];
    disableCache?: boolean;
}

function TreeNode<Type extends string, Context extends Record<Type, unknown>>({
    node,
    level,
    expanded,
    loading,
    loadedChildren,
    hasMoreChildren,
    onToggle,
    onNodeClick,
    defaultIcon: DefaultIcon,
    defaultFolderIcon: DefaultFolderIcon,
    defaultIconProps,
    defaultFolderIconProps,
    selectable,
    selectedId,
    onSelect,
    className,
    renderHoverComponent,
    renderActionsComponent,
    loadingNodeIds,
    disableCache = false,
}: TreeNodeProps<Type, Context>) {
    const [isHovered, setIsHovered] = useState(false);
    const isExpanded = expanded[node.id];
    const isLoading = loading[node.id];
    // If cache is disabled, always use fresh node.children
    // Otherwise, use cached loadedChildren if available (for async fetched data)
    const children = disableCache
        ? node.children
        : node.children || loadedChildren[node.id];
    const isSelected = selectedId === node.id;

    const IconComponent =
        node.icon || (node.isFolder ? DefaultFolderIcon : DefaultIcon);
    const iconProps: React.ComponentProps<LucideIcon> = {
        strokeWidth: isSelected ? 2.5 : 2,
        ...(node.isFolder ? defaultFolderIconProps : defaultIconProps),
        ...node.iconProps,
        className: cn(
            'h-3.5 w-3.5 text-muted-foreground flex-none',
            isSelected && 'text-primary text-white',
            node.iconProps?.className
        ),
    };

    return (
        <div className={cn(className)}>
            <div
                className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer group h-6',
                    'transition-colors duration-200',
                    isSelected
                        ? 'bg-sky-500 border border-sky-600 border dark:bg-sky-600 dark:border-sky-700'
                        : 'hover:bg-gray-200/50 border border-transparent dark:hover:bg-gray-700/50',
                    node.className
                )}
                {...(isSelected ? { 'data-selected': true } : {})}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={(e) => {
                    e.stopPropagation();
                    if (selectable && !node.unselectable) {
                        onSelect(node);
                    }
                    // if (node.isFolder) {
                    //     onToggle(node.id, node.children);
                    // }

                    // called only once in case of double click
                    if (e.detail !== 2) {
                        onNodeClick?.(node);
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (node.isFolder) {
                        onToggle(
                            node.id,
                            node.type,
                            node.context,
                            node.children
                        );
                    }
                }}
            >
                <div className="flex flex-none items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            'h-3.5 w-3.5 p-0 hover:bg-transparent flex-none',
                            isExpanded && 'rotate-90',
                            'transition-transform duration-200'
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (node.isFolder) {
                                onToggle(
                                    node.id,
                                    node.type,
                                    node.context,
                                    node.children
                                );
                            }
                        }}
                    >
                        {node.isFolder &&
                            (isLoading ? (
                                <Loader2
                                    className={cn('size-3.5 animate-spin', {
                                        'text-white': isSelected,
                                    })}
                                />
                            ) : (
                                <ChevronRight
                                    className={cn('size-3.5', {
                                        'text-white': isSelected,
                                    })}
                                    strokeWidth={2}
                                />
                            ))}
                    </Button>

                    {node.tooltip ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {loadingNodeIds?.includes(node.id) ? (
                                    <Loader2
                                        className={cn('size-3.5 animate-spin', {
                                            'text-white': isSelected,
                                        })}
                                    />
                                ) : (
                                    <IconComponent
                                        {...(isSelected
                                            ? { 'data-selected': true }
                                            : {})}
                                        {...iconProps}
                                    />
                                )}
                            </TooltipTrigger>
                            <TooltipContent
                                align="center"
                                className="max-w-[400px]"
                            >
                                {node.tooltip}
                            </TooltipContent>
                        </Tooltip>
                    ) : node.empty ? null : loadingNodeIds?.includes(
                          node.id
                      ) ? (
                        <Loader2
                            className={cn('size-3.5 animate-spin', {
                                // 'text-white': isSelected,
                            })}
                        />
                    ) : (
                        <IconComponent
                            {...(isSelected ? { 'data-selected': true } : {})}
                            {...iconProps}
                        />
                    )}
                </div>

                <span
                    {...node.labelProps}
                    className={cn(
                        'text-xs truncate min-w-0 flex-1 w-0',
                        isSelected && 'font-medium text-primary text-white',
                        node.labelProps?.className
                    )}
                    {...(isSelected ? { 'data-selected': true } : {})}
                >
                    {node.empty ? '' : node.name}
                </span>
                {renderActionsComponent && renderActionsComponent(node)}
                {isHovered && renderHoverComponent
                    ? renderHoverComponent(node)
                    : null}
            </div>

            <AnimatePresence initial={false}>
                {isExpanded && children && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                                height: {
                                    duration: Math.min(
                                        0.3 + children.length * 0.018,
                                        0.7
                                    ),
                                    ease: 'easeInOut',
                                },
                                opacity: {
                                    duration: Math.min(
                                        0.2 + children.length * 0.012,
                                        0.4
                                    ),
                                    ease: 'easeInOut',
                                },
                            },
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: {
                                    duration: Math.min(
                                        0.2 + children.length * 0.01,
                                        0.45
                                    ),
                                    ease: 'easeInOut',
                                },
                                opacity: {
                                    duration: 0.1,
                                    ease: 'easeOut',
                                },
                            },
                        }}
                        style={{ overflow: 'hidden' }}
                    >
                        {children.map((child) => (
                            <TreeNode
                                key={child.id}
                                node={child}
                                level={level + 1}
                                expanded={expanded}
                                loading={loading}
                                loadedChildren={loadedChildren}
                                hasMoreChildren={hasMoreChildren}
                                onToggle={onToggle}
                                onNodeClick={onNodeClick}
                                defaultIcon={DefaultIcon}
                                defaultFolderIcon={DefaultFolderIcon}
                                defaultIconProps={defaultIconProps}
                                defaultFolderIconProps={defaultFolderIconProps}
                                selectable={selectable}
                                selectedId={selectedId}
                                onSelect={onSelect}
                                className="mt-0.5"
                                renderHoverComponent={renderHoverComponent}
                                renderActionsComponent={renderActionsComponent}
                                loadingNodeIds={loadingNodeIds}
                                disableCache={disableCache}
                            />
                        ))}
                        {isLoading ? (
                            <TreeItemSkeleton
                                style={{
                                    paddingLeft: `${level + 2 * 16 + 8}px`,
                                }}
                            />
                        ) : null}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function findNodeById<
    Type extends string,
    Context extends Record<Type, unknown>,
>(
    nodes: TreeNode<Type, Context>[],
    id: string,
    initialPath: TreeNode<Type, Context>[] = []
): { node: TreeNode<Type, Context> | null; path: TreeNode<Type, Context>[] } {
    const path: TreeNode<Type, Context>[] = [...initialPath];
    for (const node of nodes) {
        if (node.id === id) return { node, path };
        if (node.children) {
            const found = findNodeById(node.children, id, [...path, node]);
            if (found.node) {
                return found;
            }
        }
    }
    return { node: null, path };
}
