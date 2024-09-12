import React from 'react';
import { cn } from '@/lib/utils';
import { Cardinality } from '@/lib/domain/db-relationship';
import { useLocalConfig } from '@/hooks/use-local-config';

export const MarkerDefinitions: React.FC = () => {
    const { showCardinality } = useLocalConfig();
    const cardinalityOptions: Record<Cardinality, string> = {
        one: '1',
        many: 'N',
    };

    const sideOptions: ('left' | 'right')[] = ['left', 'right'];

    if (!showCardinality) {
        return null;
    }

    return (
        <svg className="absolute left-0 top-0 z-0 size-0">
            <defs>
                {Object.entries(cardinalityOptions).map(([cardinality, text]) =>
                    sideOptions.map((side) => (
                        <marker
                            key={`cardinality_${cardinality}_${side}`}
                            id={`cardinality_${cardinality}_${side}`}
                            viewBox="0 0 16 16"
                            markerWidth="16"
                            markerHeight="16"
                            refX={side === 'left' ? '15' : '1'}
                            refY="8"
                        >
                            <circle
                                cx="8"
                                cy="8"
                                r="5"
                                className={cn([
                                    'fill-muted-foreground',
                                    'stroke-background',
                                    'stroke-[0.5]',
                                ])}
                            />
                            <text
                                x="7.9"
                                y="8.4"
                                fontSize="6"
                                fontWeight="600"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-muted"
                            >
                                {text}
                            </text>
                        </marker>
                    ))
                )}
            </defs>
        </svg>
    );
};
