import React from 'react';
import { Link } from '@/components/link/link';
import { LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ExampleOptionProps {}

export const ExampleOption: React.FC<ExampleOptionProps> = () => {
    const { t } = useTranslation();
    return (
        <Link
            href="/examples"
            className="col-span-3 text-primary hover:text-primary"
        >
            <div className="flex h-8 w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-md border py-3 text-center">
                <div className="flex items-center">
                    <LayoutGrid className="size-4" />
                </div>
                <div className="flex flex-col-reverse">
                    <div className="hidden text-sm text-primary md:flex">
                        {t(
                            'new_diagram_dialog.database_selection.check_examples_long'
                        )}
                    </div>
                    <div className="flex text-xs text-primary md:hidden">
                        {t(
                            'new_diagram_dialog.database_selection.check_examples_short'
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
};
