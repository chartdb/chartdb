export const shouldRenderLocalSchemaPackages = ({
    isDev,
    isUnavailable,
    isLoading,
    packagesCount,
}: {
    isDev: boolean;
    isUnavailable: boolean;
    isLoading: boolean;
    packagesCount: number;
}) => isDev && !isUnavailable && (packagesCount > 0 || isLoading);
