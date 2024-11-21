import React, { useCallback, useMemo } from 'react';
import type { ExportImageContext, ImageType } from './export-image-context';
import { exportImageContext } from './export-image-context';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { useReactFlow } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';
import { useTheme } from '@/hooks/use-theme';

export const ExportImageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { hideLoader, showLoader } = useFullScreenLoader();
    const { setNodes, getViewport } = useReactFlow();
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

    const exportImage: ExportImageContext['exportImage'] = useCallback(
        async (type, scale = 1) => {
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
                tempSvg.appendChild(defs);

                const backgroundRect = document.createElementNS(
                    'http://www.w3.org/2000/svg',
                    'rect'
                );
                const padding = 2000;
                backgroundRect.setAttribute('x', String(-viewport.x - padding));
                backgroundRect.setAttribute('y', String(-viewport.y - padding));
                backgroundRect.setAttribute(
                    'width',
                    String(reactFlowBounds.width + 2 * padding)
                );
                backgroundRect.setAttribute(
                    'height',
                    String(reactFlowBounds.height + 2 * padding)
                );
                backgroundRect.setAttribute('fill', 'url(#background-pattern)');
                tempSvg.appendChild(backgroundRect);

                viewportElement.insertBefore(
                    tempSvg,
                    viewportElement.firstChild
                );

                try {
                    const dataUrl = await imageCreateFn(viewportElement, {
                        ...(type === 'jpeg' || type === 'png'
                            ? {
                                  backgroundColor:
                                      effectiveTheme === 'light'
                                          ? '#ffffff'
                                          : '#141414',
                              }
                            : {}),
                        width: reactFlowBounds.width,
                        height: reactFlowBounds.height,
                        style: {
                            width: `${reactFlowBounds.width}px`,
                            height: `${reactFlowBounds.height}px`,
                            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                        },
                        quality: 1,
                        pixelRatio: scale,
                    });

                    downloadImage(dataUrl, type);
                } finally {
                    viewportElement.removeChild(tempSvg);
                    hideLoader();
                }
            }, 0);
        },
        [
            downloadImage,
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
