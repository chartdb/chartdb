import React, { useCallback, useMemo } from 'react';
import type { ExportImageContext, ImageType } from './export-image-context';
import { exportImageContext } from './export-image-context';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import { useReactFlow } from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';

export const ExportImageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { hideLoader, showLoader } = useFullScreenLoader();
    const { setNodes, getViewport } = useReactFlow();
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
                const dataUrl = await imageCreateFn(
                    window.document.querySelector(
                        '.react-flow__viewport'
                    ) as HTMLElement,
                    {
                        ...(type === 'jpeg' || type === 'png'
                            ? { backgroundColor: '#ffffff' }
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
                    }
                );

                downloadImage(dataUrl, type);
                hideLoader();
            }, 0);
        },
        [
            downloadImage,
            getViewport,
            hideLoader,
            imageCreatorMap,
            setNodes,
            showLoader,
        ]
    );

    return (
        <exportImageContext.Provider value={{ exportImage }}>
            {children}
        </exportImageContext.Provider>
    );
};
