import type { LucideIcon } from 'lucide-react';
import type React from 'react';

export interface TreeNode<
    Type extends string,
    Context extends Record<Type, unknown>,
> {
    id: string;
    name: string;
    isFolder?: boolean;
    children?: TreeNode<Type, Context>[];
    icon?: LucideIcon;
    iconProps?: React.ComponentProps<LucideIcon>;
    labelProps?: React.ComponentProps<'span'>;
    type: Type;
    unselectable?: boolean;
    tooltip?: string;
    context: Context[Type];
    empty?: boolean;
    className?: string;
}

export type FetchChildrenFunction<
    Type extends string,
    Context extends Record<Type, unknown>,
> = (
    nodeId: string,
    nodeType: Type,
    nodeContext: Context[Type]
) => Promise<TreeNode<Type, Context>[]>;

export interface SelectableTreeProps<
    Type extends string,
    Context extends Record<Type, unknown>,
> {
    enabled: boolean;
    defaultSelectedId?: string;
    onSelectedChange?: (node: TreeNode<Type, Context>) => void;
    selectedId?: string;
    setSelectedId?: React.Dispatch<React.SetStateAction<string | undefined>>;
}
