import React, { useCallback, useMemo } from 'react';
import { Button } from '@/components/button/button';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/input/input';
import { useChartDB } from '@/hooks/use-chartdb';
import { EmptyState } from '@/components/empty-state/empty-state';
import { ScrollArea } from '@/components/scroll-area/scroll-area';
import { useTranslation } from 'react-i18next';
import { CustomTypeList } from './custom-type-list/custom-type-list';

export interface CustomTypesSectionProps {}

export const CustomTypesSection: React.FC<CustomTypesSectionProps> = () => {
    const { t } = useTranslation();
    const { customTypes, createCustomType, readonly } = useChartDB();
    const [filterText, setFilterText] = React.useState('');
    const filterInputRef = React.useRef<HTMLInputElement>(null);

    const filteredCustomTypes = useMemo(() => {
        return customTypes.filter(
            (type) =>
                !filterText?.trim?.() ||
                type.name.toLowerCase().includes(filterText.toLowerCase())
        );
    }, [customTypes, filterText]);

    const handleClearFilter = useCallback(() => {
        setFilterText('');
    }, []);

    const handleCreateCustomType = useCallback(async () => {
        await createCustomType();
    }, [createCustomType]);

    return (
        <section
            className="flex flex-1 flex-col overflow-hidden px-2"
            data-vaul-no-drag
        >
            <div className="flex items-center justify-between gap-4 py-1">
                <div className="flex-1">
                    <Input
                        ref={filterInputRef}
                        type="text"
                        placeholder={t(
                            'side_panel.custom_types_section.filter'
                        )}
                        className="h-8 w-full focus-visible:ring-0"
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                    />
                </div>
                {!readonly ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-2"
                        onClick={handleCreateCustomType}
                    >
                        <Plus className="mr-1 size-4" />
                        New Type
                    </Button>
                ) : null}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <ScrollArea className="h-full">
                    {customTypes.length === 0 ? (
                        <EmptyState
                            title={t(
                                'side_panel.custom_types_section.empty_state.title'
                            )}
                            description={t(
                                'side_panel.custom_types_section.empty_state.description'
                            )}
                            className="mt-20"
                            secondaryAction={
                                !readonly
                                    ? {
                                          label: 'New Type',
                                          onClick: handleCreateCustomType,
                                      }
                                    : undefined
                            }
                        />
                    ) : filterText && filteredCustomTypes.length === 0 ? (
                        <div className="mt-10 flex flex-col items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                                {t(
                                    'side_panel.custom_types_section.no_results'
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearFilter}
                                className="gap-1"
                            >
                                <X className="size-3.5" />
                                {t('side_panel.custom_types_section.clear')}
                            </Button>
                        </div>
                    ) : (
                        <CustomTypeList customTypes={filteredCustomTypes} />
                    )}
                </ScrollArea>
            </div>
        </section>
    );
};
