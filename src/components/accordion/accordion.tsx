import React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';

import { cn } from '@/lib/utils';

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Item>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
    <AccordionPrimitive.Item
        ref={ref}
        className={cn('border-b', className)}
        {...props}
    />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
        iconPosition?: 'left' | 'right';
    }
>(({ className, children, iconPosition = 'left', ...props }, ref) => {
    const renderIcon = () => (
        <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
    );
    return (
        <AccordionPrimitive.Header className="flex">
            <AccordionPrimitive.Trigger
                ref={ref}
                className={cn(
                    'flex flex-1 items-center py-4 gap-x-2 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 justify-between',
                    className
                )}
                {...props}
            >
                {props.asChild ? (
                    <div className="flex">
                        {iconPosition === 'left' ? renderIcon() : null}
                        {children}
                        {iconPosition === 'right' ? renderIcon() : null}
                    </div>
                ) : (
                    <>
                        {iconPosition === 'left' ? renderIcon() : null}
                        {children}
                        {iconPosition === 'right' ? renderIcon() : null}
                    </>
                )}
            </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>
    );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
    React.ElementRef<typeof AccordionPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}
    >
        <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
