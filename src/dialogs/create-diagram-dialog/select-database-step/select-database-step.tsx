import React, { useCallback } from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/dialog/dialog';

import { ToggleGroup, ToggleGroupItem } from '@/components/toggle/toggle-group';
import { DatabaseType } from '@/lib/domain/database-type';
import { databaseTypeToLabelMap, getDatabaseLogo } from '@/lib/databases';
import { Link } from '@/components/link/link';
import { LayoutGrid } from 'lucide-react';
import { CreateDiagramDialogStep } from '../create-diagram-dialog-step';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';

export interface SelectDatabaseStepProps {
    setStep: React.Dispatch<React.SetStateAction<CreateDiagramDialogStep>>;
    databaseType: DatabaseType;
    setDatabaseType: React.Dispatch<React.SetStateAction<DatabaseType>>;
    hasExistingDiagram: boolean;
    createNewDiagram: () => void;
}

export const SelectDatabaseStep: React.FC<SelectDatabaseStepProps> = ({
    setStep,
    databaseType,
    setDatabaseType,
    hasExistingDiagram,
    createNewDiagram,
}) => {
    const { t } = useTranslation();
    const { effectiveTheme } = useTheme();
    const renderDatabaseOption = useCallback(
        (type: DatabaseType) => {
            const logo = getDatabaseLogo(type, effectiveTheme);
            return (
                <ToggleGroupItem
                    value={type}
                    aria-label="Toggle bold"
                    className="flex size-20 md:size-32"
                >
                    <img src={logo} alt={databaseTypeToLabelMap[type]} />
                </ToggleGroupItem>
            );
        },
        [effectiveTheme]
    );

    const renderExamplesOption = useCallback(
        () => (
            <Link href="/examples" className="text-primary hover:text-primary">
                <div className="flex size-20 cursor-pointer flex-col items-center rounded-md border py-3 text-center md:size-32">
                    <div className="flex flex-1 items-center">
                        <LayoutGrid size={34} />
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
        ),
        [t]
    );

    const renderHeader = useCallback(() => {
        return (
            <DialogHeader>
                <DialogTitle>
                    {t('new_diagram_dialog.database_selection.title')}
                </DialogTitle>
                <DialogDescription>
                    {t('new_diagram_dialog.database_selection.description')}
                </DialogDescription>
            </DialogHeader>
        );
    }, [t]);

    const renderContent = useCallback(() => {
        return (
            <div className="flex flex-1 items-center justify-center">
                <ToggleGroup
                    value={databaseType}
                    onValueChange={(value: DatabaseType) => {
                        if (!value) {
                            setDatabaseType(DatabaseType.GENERIC);
                        } else {
                            setDatabaseType(value);
                            setStep(CreateDiagramDialogStep.IMPORT_DATABASE);
                        }
                    }}
                    type="single"
                    className="grid grid-flow-row grid-cols-3 gap-6"
                >
                    {renderDatabaseOption(DatabaseType.MYSQL)}
                    {renderDatabaseOption(DatabaseType.POSTGRESQL)}
                    {renderDatabaseOption(DatabaseType.MARIADB)}
                    {renderDatabaseOption(DatabaseType.SQLITE)}
                    {renderDatabaseOption(DatabaseType.SQL_SERVER)}
                    {renderExamplesOption()}
                </ToggleGroup>
            </div>
        );
    }, [
        databaseType,
        renderDatabaseOption,
        renderExamplesOption,
        setDatabaseType,
        setStep,
    ]);

    const renderFooter = useCallback(() => {
        return (
            <DialogFooter className="mt-4 flex !justify-between gap-2">
                {hasExistingDiagram ? (
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            {t('new_diagram_dialog.cancel')}
                        </Button>
                    </DialogClose>
                ) : (
                    <div></div>
                )}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={createNewDiagram}
                    >
                        {t('new_diagram_dialog.empty_diagram')}
                    </Button>
                    <Button
                        type="button"
                        variant="default"
                        disabled={databaseType === DatabaseType.GENERIC}
                        onClick={() =>
                            setStep(CreateDiagramDialogStep.IMPORT_DATABASE)
                        }
                    >
                        {t('new_diagram_dialog.continue')}
                    </Button>
                </div>
            </DialogFooter>
        );
    }, [createNewDiagram, databaseType, hasExistingDiagram, setStep, t]);

    return (
        <>
            {renderHeader()}
            {renderContent()}
            {renderFooter()}
        </>
    );
};
