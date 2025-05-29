import React from 'react';
import { Button } from '@/components/button/button';
import {
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { DatabaseType } from '@/lib/domain/database-type';
import { useTranslation } from 'react-i18next';
import { SelectDatabaseContent } from './select-database-content';
import { useDialog } from '@/hooks/use-dialog';

export interface SelectDatabaseProps {
    onContinue: () => void;
    databaseType: DatabaseType;
    setDatabaseType: React.Dispatch<React.SetStateAction<DatabaseType>>;
    hasExistingDiagram: boolean;
    createNewDiagram: () => void;
}

export const SelectDatabase: React.FC<SelectDatabaseProps> = ({
    onContinue,
    databaseType,
    setDatabaseType,
    hasExistingDiagram,
    createNewDiagram,
}) => {
    const { t } = useTranslation();
    const { openImportDiagramDialog, openImportFromMinioDialog } = useDialog();

    return (
        <>
            <DialogHeader>
                <DialogTitle>
                    {t('new_diagram_dialog.database_selection.title')}
                </DialogTitle>
                <DialogDescription>
                    {t('new_diagram_dialog.database_selection.description')}
                </DialogDescription>
            </DialogHeader>
            <DialogInternalContent>
                <SelectDatabaseContent
                    databaseType={databaseType}
                    onContinue={onContinue}
                    setDatabaseType={setDatabaseType}
                />
            </DialogInternalContent>
            <DialogFooter className="mt-4 flex !justify-between gap-2">
                <div className="flex flex-col gap-2 md:flex-row md:justify-start md:space-x-2">
                    {hasExistingDiagram ? (
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t('new_diagram_dialog.cancel')}
                            </Button>
                        </DialogClose>
                    ) : (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={openImportDiagramDialog}
                        >
                            {t('new_diagram_dialog.import_from_file')}
                        </Button>
                    )}
                    {!hasExistingDiagram && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                openImportFromMinioDialog();
                            }}
                        >
                            {t(
                                'new_diagram_dialog.database_selection.open_from_minio'
                            )}
                        </Button>
                    )}
                </div>
                <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end md:space-x-2">
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
                        onClick={onContinue}
                    >
                        {t('new_diagram_dialog.continue')}
                    </Button>
                </div>
            </DialogFooter>
        </>
    );
};
