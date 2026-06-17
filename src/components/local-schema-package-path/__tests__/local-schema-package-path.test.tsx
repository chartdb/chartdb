import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/tooltip/tooltip';
import { LocalSchemaPackagePath } from '../local-schema-package-path';
import { getLocalSchemaPackagePath } from '@/lib/local-schema-package';

describe('getLocalSchemaPackagePath', () => {
    it('derives a relative package path from the diagram name', () => {
        expect(getLocalSchemaPackagePath('Sample Schema')).toBe(
            'schemas/sample_schema/'
        );
        expect(getLocalSchemaPackagePath('???')).toBe(null);
    });
});

describe('LocalSchemaPackagePath', () => {
    const writeTextMock = vi.fn();

    beforeEach(() => {
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText: writeTextMock },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders and copies the relative package path', async () => {
        render(
            <TooltipProvider>
                <LocalSchemaPackagePath diagramName="Sample Schema" />
            </TooltipProvider>
        );

        const copyButton = screen.getByRole('button', {
            name: 'Copy local package path schemas/sample_schema/',
        });
        expect(copyButton).toHaveTextContent('schemas/sample_schema/');

        fireEvent.click(copyButton);

        expect(writeTextMock).toHaveBeenCalledWith('schemas/sample_schema/');
    });

    it('does not render when the diagram name cannot become a package name', () => {
        const { container } = render(
            <TooltipProvider>
                <LocalSchemaPackagePath diagramName="???" />
            </TooltipProvider>
        );

        expect(container).toBeEmptyDOMElement();
    });
});
