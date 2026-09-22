import React from 'react';

import ChartDBLogo from '@/assets/logo-light.png';
import ChartDBDarkLogo from '@/assets/logo-dark.png';
import { useTheme } from '@/hooks/use-theme';
import { useConfig } from '@/hooks/use-config';
import { getConfigAssetUrl } from '@/lib/domain/config';

export const TopNavbarMock: React.FC = () => {
    const { effectiveTheme } = useTheme();
    const { config } = useConfig();
    const appName = config?.appName?.trim() || 'ChartDB';
    const customLogoUrl = getConfigAssetUrl(config?.appLogo);
    const logoSrc =
        customLogoUrl ??
        (effectiveTheme === 'light' ? ChartDBLogo : ChartDBDarkLogo);
    return (
        <nav className="flex h-[105px] flex-col justify-between border-b px-3 md:h-12 md:flex-row md:items-center md:px-4">
            <div className="flex flex-1 flex-col justify-between gap-x-1 md:flex-row md:justify-normal">
                <div className="flex items-center justify-between pt-[8px] font-primary md:py-[10px]">
                    <a
                        href="https://chartdb.io"
                        className="cursor-pointer"
                        rel="noreferrer"
                    >
                        <img
                            src={logoSrc}
                            alt={appName}
                            className="h-4 max-w-fit"
                        />
                    </a>
                </div>
            </div>
        </nav>
    );
};
