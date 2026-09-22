import React, { useEffect, useState } from 'react';
import { ConfigContext } from './config-context';

import { useStorage } from '@/hooks/use-storage';
import type { ChartDBConfig } from '@/lib/domain/config';

const defaultPrimaryForegroundLight = '210 40% 98%';
const defaultPrimaryForegroundDark = '222.2 47.4% 11.2%';

const parseRgb = (value: string) => {
    const parts = value.match(/[\d.]+/g);
    if (!parts || parts.length < 3) return null;
    const [r, g, b] = parts.slice(0, 3).map((part) => Number(part));
    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
        return null;
    }
    return { r, g, b };
};

const rgbToHsl = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;
    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    const delta = max - min;
    let h = 0;

    if (delta !== 0) {
        if (max === rNorm) {
            h = ((gNorm - bNorm) / delta) % 6;
        } else if (max === gNorm) {
            h = (bNorm - rNorm) / delta + 2;
        } else {
            h = (rNorm - gNorm) / delta + 4;
        }
        h *= 60;
        if (h < 0) h += 360;
    }

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    return { h, s: s * 100, l: l * 100 };
};

const getLuminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
    const toLinear = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928
            ? normalized / 12.92
            : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

const resolvePrimaryColor = (value?: string | null) => {
    if (!value) return null;
    if (typeof document === 'undefined') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const probe = document.createElement('span');
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.color = trimmed;
    if (!probe.style.color) return null;

    const container = document.body ?? document.documentElement;
    container.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    probe.remove();

    const rgb = parseRgb(computed);
    if (!rgb) return null;

    const { h, s, l } = rgbToHsl(rgb);
    return {
        hsl: `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`,
        luminance: getLuminance(rgb),
    };
};

export const ConfigProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { getConfig, updateConfig: updateDataConfig } = useStorage();
    const [config, setConfig] = useState<ChartDBConfig | undefined>();

    useEffect(() => {
        const loadConfig = async () => {
            const config = await getConfig();
            setConfig(config);
        };

        loadConfig();
    }, [getConfig]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        const resolved = resolvePrimaryColor(config?.primaryColor);

        if (!resolved) {
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
            return;
        }

        root.style.setProperty('--primary', resolved.hsl);
        root.style.setProperty(
            '--primary-foreground',
            resolved.luminance > 0.6
                ? defaultPrimaryForegroundDark
                : defaultPrimaryForegroundLight
        );
    }, [config?.primaryColor]);

    const updateConfig: ConfigContext['updateConfig'] = async ({
        config,
        updateFn,
    }) => {
        const promise = new Promise<void>((resolve) => {
            setConfig((prevConfig) => {
                let baseConfig: ChartDBConfig = {
                    defaultDiagramId: '',
                    hideSocialLinks: false,
                };
                if (prevConfig) {
                    baseConfig = prevConfig;
                }

                const updatedConfig = updateFn
                    ? updateFn(baseConfig)
                    : { ...baseConfig, ...config };

                updateDataConfig(updatedConfig).then(() => {
                    resolve();
                });
                return updatedConfig;
            });
        });

        return promise;
    };

    return (
        <ConfigContext.Provider
            value={{
                config,
                updateConfig,
            }}
        >
            {children}
        </ConfigContext.Provider>
    );
};
