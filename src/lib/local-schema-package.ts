export const LOCAL_SCHEMA_PACKAGES_ENDPOINT = '/api/local-schema-packages';

export interface LocalSchemaPackageMetadata {
    packageName: string;
    diagramName: string;
    relativePath: string;
    diagramJsonPath: string;
    schemaPath?: string;
    absolutePath: string;
    updatedAt: string;
    hasDbml: boolean;
    tablesCount?: number;
}

export const sanitizeLocalSchemaPackageName = (diagramName: string): string =>
    diagramName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_-]/g, '');

export const getLocalSchemaPackagePath = (
    diagramName?: string
): string | null => {
    if (!diagramName) {
        return null;
    }

    const packageName = sanitizeLocalSchemaPackageName(diagramName);
    return packageName ? `schemas/${packageName}/` : null;
};
