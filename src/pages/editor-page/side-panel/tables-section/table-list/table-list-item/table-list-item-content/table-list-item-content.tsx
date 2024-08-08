import React from 'react';
import { Ellipsis } from 'lucide-react';
import { Input } from '@/components/input/input';
import { Combobox } from '@/components/combobox/combobox';
import { Button } from '@/components/button/button';
import { KeyRound } from 'lucide-react';

export interface TableListItemContentProps {
    tableColor: string;
}

export const TableListItemContent: React.FC<TableListItemContentProps> = ({
    tableColor,
}) => {
    const renderColumn = () => {
        return (
            <div className="flex flex-row p-1 justify-between flex-1">
                <div className="flex basis-8/12 gap-1">
                    <Input
                        type="text"
                        placeholder="Name"
                        className="h-8 focus-visible:ring-0 basis-8/12"
                    />
                    <Combobox
                        className="flex h-8 basis-4/12"
                        mode="single"
                        options={[
                            {
                                label: 'small_int',
                                value: 'smallint',
                            },
                            {
                                label: 'json',
                                value: 'json',
                            },
                            {
                                label: 'jsonb',
                                value: 'jsonb',
                            },
                            {
                                label: 'varchar',
                                value: 'varchar',
                            },
                        ]}
                        placeholder="Type"
                        selected={''}
                        onChange={(value) => console.log(value)}
                        emptyText="No types found."
                    />
                </div>
                <div className="flex">
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 text-xs h-8"
                    >
                        N
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                    >
                        <KeyRound className="h-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        className="hover:bg-primary-foreground p-2 w-[32px] text-slate-500 hover:text-slate-700 h-8"
                    >
                        <Ellipsis className="h-3.5" />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <div
            className="border-l-[6px] rounded-b-md"
            style={{
                borderColor: tableColor,
            }}
        >
            {renderColumn()}
        </div>
    );
};
