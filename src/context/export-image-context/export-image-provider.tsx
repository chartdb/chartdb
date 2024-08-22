import React, { useCallback, useMemo } from 'react';
import {
    ExportImageContext,
    exportImageContext,
    ImageType,
} from './export-image-context';
import { toJpeg, toPng, toSvg } from 'html-to-image';
import {
    getNodesBounds,
    getViewportForBounds,
    useReactFlow,
} from '@xyflow/react';
import { useChartDB } from '@/hooks/use-chartdb';
import { useFullScreenLoader } from '@/hooks/use-full-screen-spinner';

const imageWidth = 1024;
const imageHeight = 768;

export const ExportImageProvider: React.FC<React.PropsWithChildren> = ({
    children,
}) => {
    const { hideLoader, showLoader } = useFullScreenLoader();
    const { getNodes, setNodes } = useReactFlow();
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
        async (type) => {
            showLoader({
                animated: false,
            });

            setNodes((nodes) =>
                nodes.map((node) => ({ ...node, selected: false }))
            );

            const nodesBounds = getNodesBounds(getNodes());
            const viewport = getViewportForBounds(
                nodesBounds,
                imageWidth,
                imageHeight,
                0.01,
                2,
                0.02
            );

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
                        width: imageWidth,
                        height: imageHeight,
                        style: {
                            width: `${imageWidth}px`,
                            height: `${imageHeight}px`,
                            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                        },
                        quality: 1,
                    }
                );

                downloadImage(dataUrl, type);
                hideLoader();
            }, 0);
        },
        [
            downloadImage,
            getNodes,
            imageCreatorMap,
            setNodes,
            showLoader,
            hideLoader,
        ]
    );

    return (
        <exportImageContext.Provider value={{ exportImage }}>
            {children}
        </exportImageContext.Provider>
    );
};
