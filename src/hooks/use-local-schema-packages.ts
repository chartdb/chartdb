import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '@/hooks/use-config';
import { useDialog } from '@/hooks/use-dialog';
import { useStorage } from '@/hooks/use-storage';
import { diagramFromJSONInput } from '@/lib/export-import-utils';
import {
    LOCAL_SCHEMA_PACKAGES_ENDPOINT,
    type LocalSchemaPackageMetadata,
} from '@/lib/local-schema-package';

interface LocalSchemaPackagesResponse {
    packages?: LocalSchemaPackageMetadata[];
}

interface LocalSchemaPackageDiagramResponse {
    diagramJson?: string;
}

export const useLocalSchemaPackages = () => {
    const [packages, setPackages] = useState<LocalSchemaPackageMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUnavailable, setIsUnavailable] = useState(!import.meta.env.DEV);
    const { addDiagram } = useStorage();
    const { updateConfig } = useConfig();
    const { closeOpenDiagramDialog } = useDialog();
    const navigate = useNavigate();

    const refreshPackages = useCallback(async () => {
        if (!import.meta.env.DEV) {
            setPackages([]);
            setIsUnavailable(true);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(LOCAL_SCHEMA_PACKAGES_ENDPOINT);
            if (!response.ok) {
                throw new Error(`package discovery failed ${response.status}`);
            }

            const body = (await response.json()) as LocalSchemaPackagesResponse;
            setPackages(body.packages ?? []);
            setIsUnavailable(false);
        } catch {
            setPackages([]);
            setIsUnavailable(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const openPackage = useCallback(
        async (schemaPackage: LocalSchemaPackageMetadata) => {
            const response = await fetch(
                `${LOCAL_SCHEMA_PACKAGES_ENDPOINT}/${encodeURIComponent(
                    schemaPackage.packageName
                )}/diagram`
            );
            if (!response.ok) {
                throw new Error(`package open failed ${response.status}`);
            }

            const body =
                (await response.json()) as LocalSchemaPackageDiagramResponse;
            if (!body.diagramJson) {
                throw new Error('package diagram JSON missing');
            }

            const diagram = diagramFromJSONInput(body.diagramJson);
            await addDiagram({ diagram });
            await updateConfig({ config: { defaultDiagramId: diagram.id } });
            closeOpenDiagramDialog();
            navigate(`/diagrams/${diagram.id}`);
        },
        [addDiagram, closeOpenDiagramDialog, navigate, updateConfig]
    );

    return {
        packages,
        isLoading,
        isUnavailable,
        refreshPackages,
        openPackage,
    };
};
