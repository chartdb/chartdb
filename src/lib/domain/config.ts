export interface ChartDBConfig {
    defaultDiagramId: string;
    exportActions?: Date[];
    appName?: string;
    appLogo?: string;
    hideSocialLinks?: boolean;
    primaryColor?: string;
}

export const getConfigAssetUrl = (
    assetPath?: string | null
): string | undefined => {
    if (!assetPath) return undefined;
    const trimmed = assetPath.trim();
    if (!trimmed) return undefined;
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:')
    ) {
        return trimmed;
    }
    const normalized = trimmed.replace(/^[\\/]+/, '');
    if (!normalized) return undefined;
    return `/api/config/assets/${encodeURIComponent(normalized)}`;
};
