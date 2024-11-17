import React, { useCallback, useMemo, useState } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu/dropdown-menu';

import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/tooltip/tooltip';
import type {
    SelectBoxOption,
    SelectBoxProps,
} from '@/components/select-box/select-box';
import { SelectBox } from '@/components/select-box/select-box';
import { languages } from '@/i18n/i18n';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/button/button-variants';

export interface LanguageNavProps {}
export const LanguageNav: React.FC<LanguageNavProps> = () => {
    const { t, i18n } = useTranslation();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const languagesOptions: SelectBoxOption[] = languages.map((lang) => ({
        label: lang.nativeName,
        value: lang.code,
        description: `(${lang.name})`,
    }));

    const handleLanguageChange: SelectBoxProps['onChange'] = useCallback(
        (language: string | string[]) => {
            i18n.changeLanguage(language as string);
            setDropdownOpen(false);
        },
        [i18n]
    );

    const language = useMemo(() => {
        return i18n.languages
            .map((lang) => languagesOptions.find((opt) => opt.value === lang))
            .find((opt) => opt !== undefined)?.value;
    }, [i18n, languagesOptions]);

    return (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                        <div
                            className={cn(
                                buttonVariants({
                                    variant: 'outline',
                                    size: 'icon',
                                }),
                                'size-6 rounded-full md:size-8 cursor-pointer'
                            )}
                        >
                            <Globe className="size-3.5 md:size-4" />
                            <span className="sr-only">Change language</span>
                        </div>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    {t('language_select.change_language')}
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent className="w-56">
                <div className="p-2">
                    <SelectBox
                        className="flex h-8 min-h-8 w-full"
                        options={languagesOptions}
                        value={language}
                        onChange={handleLanguageChange}
                    />
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
