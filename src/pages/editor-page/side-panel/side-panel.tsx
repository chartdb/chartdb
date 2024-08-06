import React from 'react';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/select/select';
import { TablesSection } from './tables-section/tables-section';

export interface SidePanelProps {}

export const SidePanel: React.FC<SidePanelProps> = () => {
    const [selected, setSelected] = React.useState('tables');
    return (
        <aside className="flex h-full flex-col">
            <div className="flex justify-center border-b">
                <Select
                    value={selected}
                    onValueChange={(value) => setSelected(value)}
                >
                    <SelectTrigger className="border-none shadow-none focus:border-transparent focus:ring-0">
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
            {selected === 'tables' ? <TablesSection /> : null}
        </aside>
    );
};
