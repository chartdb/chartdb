import React, { useCallback, useMemo } from 'react';
import type { ExportImageContext, ImageType } from './export-image-context';
import { exportImageContext } from './export-image-context';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useTheme } from '@/hooks/use-theme';
import type { EffectiveTheme } from '../theme-context/theme-context';

export const ExportImageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { hideLoader, showLoader } = useFullScreenLoader();
    const { setNodes, getNodes, getViewport } = useReactFlow();
    const { effectiveTheme } = useTheme();
    const { diagramName } = useChartDB();

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

                // Compute tight bounding box of all nodes and derive
                // the exact transform to render them into the output
                // image at 1:1 scale with fixed pixel padding.
                // Falls back to the live viewport if the canvas is empty.
                const nodes = getNodes();
                const nodesBounds = getNodesBounds(nodes);
                const PADDING_PX = 40;
                let imageWidth: number;
                let imageHeight: number;
                let exportViewport: {
                    x: number;
                    y: number;
                    zoom: number;
                };

                if (nodes.length === 0) {
                    const viewport = getViewport();
                    imageWidth = reactFlowBounds.width;
                    imageHeight = reactFlowBounds.height;
                    exportViewport = viewport;
                } else {
                    imageWidth = nodesBounds.width + 2 * PADDING_PX;
                    imageHeight = nodesBounds.height + 2 * PADDING_PX;
                    exportViewport = {
                        x: -nodesBounds.x + PADDING_PX,
                        y: -nodesBounds.y + PADDING_PX,
                        zoom: 1,
                    };
                }

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
                    `0 0 ${imageWidth} ${imageHeight}`
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
                    pattern.setAttribute(
                        'width',
                        String(16 * exportViewport.zoom)
                    );
                    pattern.setAttribute(
                        'height',
                        String(16 * exportViewport.zoom)
                    );
                    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
                    pattern.setAttribute(
                        'patternTransform',
                        `translate(${exportViewport.x % (16 * exportViewport.zoom)} ${exportViewport.y % (16 * exportViewport.zoom)})`
                    );

                    const dot = document.createElementNS(
                        'http://www.w3.org/2000/svg',
                        'circle'
                    );

                    const dotSize = exportViewport.zoom * 0.5;
                    dot.setAttribute('cx', String(exportViewport.zoom));
                    dot.setAttribute('cy', String(exportViewport.zoom));
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
                    String(-exportViewport.x - bgPadding)
                );
                backgroundRect.setAttribute(
                    'y',
                    String(-exportViewport.y - bgPadding)
                );
                backgroundRect.setAttribute(
                    'width',
                    String(imageWidth + 2 * bgPadding)
                );
                backgroundRect.setAttribute(
                    'height',
                    String(imageHeight + 2 * bgPadding)
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
                    const dataUrl = await imageCreateFn(viewportElement, {
                        backgroundColor:
                            type !== 'svg'
                                ? getBackgroundColor(
                                      effectiveTheme,
                                      transparent
                                  )
                                : undefined,
                        width: imageWidth,
                        height: imageHeight,
                        style: {
                            width: `${imageWidth}px`,
                            height: `${imageHeight}px`,
                            transform: `translate(${exportViewport.x}px, ${exportViewport.y}px) scale(${exportViewport.zoom})`,
                        },
                        quality: 1,
                        pixelRatio: scale,
                        skipFonts: true,
                    });

                    downloadImage(dataUrl, type);
                } finally {
                    // Restore original styles
                    originalStyles.forEach(
                        ({ element, stroke, strokeWidth }) => {
                            element.style.stroke = stroke;
                            element.style.strokeWidth = strokeWidth;
                        }
                    );
                    viewportElement.removeChild(tempSvg);
                    hideLoader();
                }
            }, 0);
        },
        [
            getBackgroundColor,
            downloadImage,
            getNodes,
            getViewport,
            hideLoader,
            imageCreatorMap,
            setNodes,
            showLoader,
            effectiveTheme,
        ]
    );

    return (
        <exportImageContext.Provider value={{ exportImage }}>
            {children}
        </exportImageContext.Provider>
    );
};
