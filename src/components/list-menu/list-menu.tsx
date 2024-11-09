import React from 'react';
import { Link } from '@/components/link/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ListMenuItem {
    title: string;
    href: string;
    icon?: LucideIcon;
    selected?: boolean;
}
export interface ListMenuProps extends React.HTMLAttributes<HTMLDivElement> {
    items: ListMenuItem[];
}

export const ListMenu = React.forwardRef<HTMLDivElement, ListMenuProps>(
    ({ className, items }, ref) => {
        return (
            <div className={cn('flex flex-col gap-0.5', className)} ref={ref}>
                {items.map((item) => (
                    <Link
                        key={item.href}
                        className={cn(
                            'flex h-7 w-full text-pink-600 dark:text-white items-center gap-1 rounded-sm p-1 text-sm transition-colors hover:bg-pink-100 dark:hover:bg-pink-900 hover:no-underline',
                            item.selected
                                ? 'bg-pink-100 dark:bg-pink-900 font-semibold'
                                : 'text-muted-foreground hover:bg-pink-50 dark:hover:bg-pink-950 hover:text-pink-600 dark:hover:text-white'
                        )}
                        href={item.href}
                    >
                        {item.icon ? (
                            <item.icon
                                size="13"
                                strokeWidth={item.selected ? 2.4 : 2}
                            />
                        ) : null}
                        <span className="min-w-0 truncate">{item.title}</span>
                    </Link>
                ))}
            </div>
        );
    }
);

ListMenu.displayName = 'ListMenu';
