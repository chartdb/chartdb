import React, { useCallback, useMemo, useEffect, useState } from 'react';
import type { ExportImageContext, ImageType } from './export-image-context';
import { exportImageContext } from './export-image-context';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import {
    getNodesBounds,
    getViewportForBounds,
    useReactFlow,
} from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useTheme } from '@/hooks/use-theme';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';
import type { EffectiveTheme } from '../theme-context/theme-context';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/toast/use-toast';
import { dedupeSvgDataUrlStyles } from './dedupe-svg-styles';

// Above this many tables a full-diagram SVG export can take several seconds
const LARGE_SVG_TABLE_COUNT = 100;

export const ExportImageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { hideLoader, showLoader } = useFullScreenLoader();
    const { setNodes, getViewport, getNodes, setViewport } = useReactFlow();
    const { effectiveTheme } = useTheme();
    const { t } = useTranslation();
    const { toast } = useToast();
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

            // The canvas only renders visible nodes, so for SVG fit the
            // live viewport to all nodes first so every table is in the DOM
            // (#1083). The original viewport is restored afterwards.
            // Empty diagrams fall back to exporting the current viewport.
            const visibleNodes = getNodes().filter((node) => !node.hidden);
            const fitWholeDiagram = type === 'svg' && visibleNodes.length > 0;
            if (
                fitWholeDiagram &&
                visibleNodes.filter((node) => node.type === 'table').length >
                    LARGE_SVG_TABLE_COUNT
            ) {
                toast({
                    description: t('export_image_dialog.large_svg_warning'),
                });
            }
            if (fitWholeDiagram) {
                // Let the loader and warning paint before the capture work
                // blocks the main thread
                await new Promise((resolve) =>
                    requestAnimationFrame(() => setTimeout(resolve, 50))
                );
            }
            const nodesBounds = getNodesBounds(visibleNodes);
            if (fitWholeDiagram) {
                await setViewport(
                    getViewportForBounds(
                        nodesBounds,
                        reactFlowBounds.width,
                        reactFlowBounds.height,
                        0.01,
                        2,
                        0.05
                    )
                );
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

                // Inline styles for marker elements before copying since skipFonts: true prevents CSS processing
                const markerCircles = document.querySelectorAll(
                    '.marker-definitions marker circle'
                ) as NodeListOf<SVGCircleElement>;
                const markerTexts = document.querySelectorAll(
                    '.marker-definitions marker text'
                ) as NodeListOf<SVGTextElement>;

                const originalMarkerStyles: {
                    element: SVGElement;
                    fill: string;
                    stroke: string;
                }[] = [];

                markerCircles.forEach((circle) => {
                    const computedStyle = window.getComputedStyle(circle);
                    originalMarkerStyles.push({
                        element: circle,
                        fill: circle.style.fill,
                        stroke: circle.style.stroke,
                    });
                    circle.style.fill = computedStyle.fill;
                    circle.style.stroke = computedStyle.stroke;
                });

                markerTexts.forEach((text) => {
                    const computedStyle = window.getComputedStyle(text);
                    originalMarkerStyles.push({
                        element: text,
                        fill: text.style.fill,
                        stroke: text.style.stroke,
                    });
                    text.style.fill = computedStyle.fill;
                });

                if (markerDefs) {
                    defs.innerHTML = markerDefs.innerHTML;
                }

                // Restore original marker styles
                originalMarkerStyles.forEach(({ element, fill, stroke }) => {
                    element.style.fill = fill;
                    element.style.stroke = stroke;
                });

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

                // Inline stroke styles for edge paths since skipFonts: true prevents CSS processing
                const edgePaths = viewportElement.querySelectorAll(
                    '.react-flow__edge-path'
                ) as NodeListOf<SVGPathElement>;
                const originalStyles: {
                    element: SVGPathElement;
                    stroke: string;
                    strokeWidth: string;
                }[] = [];

                edgePaths.forEach((path) => {
                    const computedStyle = window.getComputedStyle(path);
                    originalStyles.push({
                        element: path,
                        stroke: path.style.stroke,
                        strokeWidth: path.style.strokeWidth,
                    });
                    path.style.stroke = computedStyle.stroke;
                    path.style.strokeWidth = computedStyle.strokeWidth;
                });

                try {
                    // Handle SVG export differently
                    if (type === 'svg') {
                        // Capture the whole diagram, not just the visible
                        // viewport (#1083)
                        const padding = 40;
                        const svgWidth = fitWholeDiagram
                            ? Math.ceil(nodesBounds.width + padding * 2)
                            : reactFlowBounds.width;
                        const svgHeight = fitWholeDiagram
                            ? Math.ceil(nodesBounds.height + padding * 2)
                            : reactFlowBounds.height;
                        const fitted = fitWholeDiagram
                            ? getViewportForBounds(
                                  nodesBounds,
                                  svgWidth,
                                  svgHeight,
                                  1,
                                  1,
                                  0
                              )
                            : viewport;
                        const dataUrl = await imageCreateFn(viewportElement, {
                            width: svgWidth,
                            height: svgHeight,
                            style: {
                                width: `${svgWidth}px`,
                                height: `${svgHeight}px`,
                                transform: `translate(${fitted.x}px, ${fitted.y}px) scale(${fitted.zoom})`,
                            },
                            quality: 1,
                            pixelRatio: scale,
                            skipFonts: true,
                        });
                        downloadImage(dedupeSvgDataUrlStyles(dataUrl), type);
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
                    // Restore original styles
                    originalStyles.forEach(
                        ({ element, stroke, strokeWidth }) => {
                            element.style.stroke = stroke;
                            element.style.strokeWidth = strokeWidth;
                        }
                    );
                    viewportElement.removeChild(tempSvg);
                    if (fitWholeDiagram) {
                        setViewport(viewport);
                    }
                    hideLoader();
                }
            }, 0);
        },
        [
            getBackgroundColor,
            downloadImage,
            getViewport,
            getNodes,
            setViewport,
            hideLoader,
            imageCreatorMap,
            setNodes,
            showLoader,
            effectiveTheme,
            logoBase64,
            t,
            toast,
        ]
    );

    return (
        <exportImageContext.Provider value={{ exportImage }}>
            {children}
        </exportImageContext.Provider>
    );
};
