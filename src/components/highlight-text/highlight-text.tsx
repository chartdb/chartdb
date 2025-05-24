import React from 'react';

interface HighlightTextProps {
    text: string;
    highlight: string;
    caseSensitive?: boolean;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
    text,
    highlight,
    caseSensitive = false,
}) => {
    if (!highlight.trim()) {
        return <span>{text}</span>;
    }

    const regex = new RegExp(
        `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        caseSensitive ? 'g' : 'gi'
    );

    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) => {
                const isMatch = part.toLowerCase() === highlight.toLowerCase();
                return isMatch ? (
                    <span
                        key={i}
                        className="rounded bg-yellow-300 px-0.5 font-medium dark:bg-yellow-700"
                    >
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                );
            })}
        </>
    );
};
