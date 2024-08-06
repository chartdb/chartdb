import React from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    return (
        <aside className="flex h-full flex-col">
            <div className="flex justify-center border-b">
                <Select defaultValue="tables">
                    <SelectTrigger className="mt-1 border-none shadow-none focus:border-transparent focus:ring-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem value="tables">Tables</SelectItem>
                            <SelectItem value="relationships">
                                Relationships
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
        </aside>
    );
};
