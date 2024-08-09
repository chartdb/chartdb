import { Button } from '@/components/button/button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { FileMinus2, FileOutput, Trash2 } from 'lucide-react';
import React from 'react';

export interface RelationshipListItemContentProps {}

export const RelationshipListItemContent: React.FC<
    RelationshipListItemContentProps
> = () => {
    return (
        <div className="rounded-b-md px-1 flex flex-col my-1">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center gap-1 text-xs">
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex flex-row items-center gap-1">
                            <FileMinus2 className="h-4 w-4 text-slate-700" />
                            <div className="font-bold text-slate-700">
                                Primary
                            </div>
                        </div>
                        table_1(id)
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                        <div className="flex flex-row items-center gap-1">
                            <FileOutput className="h-4 w-4 text-slate-700" />
                            <div className="font-bold text-slate-700">
                                Foreign
                            </div>
                        </div>
                        table_2(table_1_id)
                    </div>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                    <div className="flex flex-row items-center gap-1">
                        <FileOutput className="h-4 w-4 text-slate-700" />
                        <div className="font-bold text-slate-700">
                            Cardinality
                        </div>
                    </div>

                    <Select defaultValue={'one_to_one'}>
                        <SelectTrigger className="h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="one_to_one">
                                    One to One
                                </SelectItem>
                                <SelectItem value="one_to_many">
                                    One to Many
                                </SelectItem>
                                <SelectItem value="many_to_one">
                                    Many to One
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex items-center justify-center flex-1 pt-2">
                <Button variant="ghost" className="text-xs h-8 p-2">
                    <Trash2 className="h-3.5 w-3.5 mr-1 text-red-700" />
                    <div className="text-red-700">Delete</div>
                </Button>
            </div>
        </div>
    );
};
