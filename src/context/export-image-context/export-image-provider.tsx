import React, { useCallback, useMemo, useEffect, useState } from 'react';
import type { ExportImageContext, ImageType } from './export-image-context';
import { exportImageContext } from './export-image-context';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { useReactFlow } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useTheme } from '@/hooks/use-theme';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import type { EffectiveTheme } from '../theme-context/theme-context';

export const ExportImageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { hideLoader, showLoader } = useFullScreenLoader();
    const { setNodes, getViewport } = useReactFlow();
    const { effectiveTheme } = useTheme();
    const { diagramName } = useChartDB();
    const [logoBase64, setLogoBase64] = useState<string>('');

    useEffect(() => {
        // Convert logo to base64 on component mount
        const img = new Image();
        img.src = effectiveTheme === 'light' ? logoLight : logoDark;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                const base64 = canvas.toDataURL('image/png');
                setLogoBase64(base64);
            }
        };
    }, [effectiveTheme]);

    const downloadImage = useCallback(
        (dataUrl: string, type: ImageType) => {
            const a = document.createElement('a');
            a.setAttribute('download', `${diagramName}.${type}`);
            a.setAttribute('href', dataUrl);
            a.click();
        },
        [diagramName]
    );

    const imageCreatorMap: Record<
        ImageType,
        typeof toJpeg | typeof toPng | typeof toSvg
    > = useMemo(
        () => ({
            jpeg: toJpeg,
            png: toPng,
            svg: toSvg,
        }),
        []
    );

    const getBackgroundColor = useCallback(
        (theme: EffectiveTheme, transparent: boolean): string => {
            if (transparent) return 'transparent';
            return theme === 'light' ? '#ffffff' : '#141414';
        },
        []
    );

    const exportImage: ExportImageContext['exportImage'] = useCallback(
        async (type, { includePatternBG, transparent, scale }) => {
            showLoader({
                animated: false,
            });

            setNodes((nodes) =>
                nodes.map((node) => ({ ...node, selected: false }))
            );

            const viewport = getViewport();
            const reactFlowBounds = document
                .querySelector('.react-flow')
                ?.getBoundingClientRect();

            if (!reactFlowBounds) {
                console.error('Could not find React Flow container');
                hideLoader();
                return;
            }

            const imageCreateFn = imageCreatorMap[type];

            setTimeout(async () => {
                const viewportElement = window.document.querySelector(
                    '.react-flow__viewport'
                ) as HTMLElement;

                const markerDefs = document.querySelector(
                    '.marker-definitions defs'
                );

                const tempSvg = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'svg'
                );
                tempSvg.style.position = 'absolute';
                tempSvg.style.top = '0';
                tempSvg.style.left = '0';
                tempSvg.style.width = '100%';
                tempSvg.style.height = '100%';
                tempSvg.style.overflow = 'visible';
                tempSvg.style.zIndex = '-50';
                tempSvg.setAttribute(
                    'viewBox',
                    `0 0 ${reactFlowBounds.width} ${reactFlowBounds.height}`
                );

                const defs = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'defs'
                );

                if (markerDefs) {
                    defs.innerHTML = markerDefs.innerHTML;
                }

                if (includePatternBG) {
                    const pattern = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'pattern'
                    );
                    pattern.setAttribute('id', 'background-pattern');
                    pattern.setAttribute('width', String(16 * viewport.zoom));
                    pattern.setAttribute('height', String(16 * viewport.zoom));
                    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
                    pattern.setAttribute(
                        'patternTransform',
                        `translate(${viewport.x % (16 * viewport.zoom)} ${viewport.y % (16 * viewport.zoom)})`
                    );

                    const dot = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'circle'
                    );

                    const dotSize = viewport.zoom * 0.5;
                    dot.setAttribute('cx', String(viewport.zoom));
                    dot.setAttribute('cy', String(viewport.zoom));
                    dot.setAttribute('r', String(dotSize));
                    const dotColor =
                        effectiveTheme === 'light' ? '#92939C' : '#777777';
                    dot.setAttribute('fill', dotColor);

                    pattern.appendChild(dot);
                    defs.appendChild(pattern);
                }

                tempSvg.appendChild(defs);

                const backgroundRect = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'rect'
                );
                const bgPadding = 2000;
                backgroundRect.setAttribute(
                    'x',
                    String(-viewport.x - bgPadding)
                );
                backgroundRect.setAttribute(
                    'y',
                    String(-viewport.y - bgPadding)
                );
                backgroundRect.setAttribute(
                    'width',
                    String(reactFlowBounds.width + 2 * bgPadding)
                );
                backgroundRect.setAttribute(
                    'height',
                    String(reactFlowBounds.height + 2 * bgPadding)
                );
                backgroundRect.setAttribute('fill', 'url(#background-pattern)');
                tempSvg.appendChild(backgroundRect);

                viewportElement.insertBefore(
                    tempSvg,
                    viewportElement.firstChild
                );

                try {
                    // Handle SVG export differently
                    if (type === 'svg') {
                        const dataUrl = await imageCreateFn(viewportElement, {
                            width: reactFlowBounds.width,
                            height: reactFlowBounds.height,
                            style: {
                                width: `${reactFlowBounds.width}px`,
                                height: `${reactFlowBounds.height}px`,
                                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                            },
                            quality: 1,
                            pixelRatio: scale,
                            skipFonts: true,
                        });
                        downloadImage(dataUrl, type);
                        return;
                    }

                    // For PNG and JPEG, continue with the watermark process
                    const initialDataUrl = await imageCreateFn(
                        viewportElement,
                        {
                            backgroundColor: getBackgroundColor(
                                effectiveTheme,
                                transparent
                            ),
                            width: reactFlowBounds.width,
                            height: reactFlowBounds.height,
                            style: {
                                width: `${reactFlowBounds.width}px`,
                                height: `${reactFlowBounds.height}px`,
                                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                            },
                            quality: 1,
                            pixelRatio: scale,
                            skipFonts: true,
                        }
                    );

                    // Create a canvas to combine the diagram and watermark
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        downloadImage(initialDataUrl, type);
                        return;
                    }

                    // Set canvas size to match the export size
                    canvas.width = reactFlowBounds.width * scale;
                    canvas.height = reactFlowBounds.height * scale;

                    // Load the exported diagram
                    const diagramImage = new Image();
                    diagramImage.src = initialDataUrl;

                    await new Promise((resolve) => {
                        diagramImage.onload = async () => {
                            // Draw the diagram
                            ctx.drawImage(diagramImage, 0, 0);

                            // Calculate logo size
                            const logoHeight = Math.max(
                                24,
                                Math.floor(canvas.width * 0.024)
                            );
                            const padding = Math.max(
                                12,
                                Math.floor(logoHeight * 0.5)
                            );

                            // Load and draw the logo
                            const logoImage = new Image();
                            logoImage.src = logoBase64;

                            await new Promise((resolve) => {
                                logoImage.onload = () => {
                                    // Calculate logo width while maintaining aspect ratio
                                    const logoWidth =
                                        (logoImage.width / logoImage.height) *
                                        logoHeight;

                                    // Draw logo in bottom-left corner
                                    ctx.globalAlpha = 0.9;
                                    ctx.drawImage(
                                        logoImage,
                                        padding,
                                        canvas.height - logoHeight - padding,
                                        logoWidth,
                                        logoHeight
                                    );
                                    ctx.globalAlpha = 1;
                                    resolve(null);
                                };
                            });

                            // Convert canvas to data URL
                            const finalDataUrl = canvas.toDataURL(
                                type === 'png' ? 'image/png' : 'image/jpeg'
                            );
                            downloadImage(finalDataUrl, type);
                            resolve(null);
                        };
                    });
                } finally {
                    viewportElement.removeChild(tempSvg);
                    hideLoader();
                }
            }, 0);
        },
        [
            getBackgroundColor,
            downloadImage,
            getViewport,
            hideLoader,
            imageCreatorMap,
            setNodes,
            showLoader,
            effectiveTheme,
            logoBase64,
        ]
    );

    return (
        <exportImageContext.Provider value={{ exportImage }}>
            {children}
        </exportImageContext.Provider>
    );
};
