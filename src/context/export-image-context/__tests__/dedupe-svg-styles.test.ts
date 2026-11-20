import { describe, it, expect } from 'vitest';
import {
    dedupeSvgDataUrlStyles,
    dedupeSvgInlineStyles,
} from '../dedupe-svg-styles';

describe('dedupeSvgInlineStyles', () => {
    it('hoists duplicate inline styles into one rule each', () => {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="10"><foreignObject>' +
            '<div class="a" style="color: red; font-family: &quot;Inter&quot;;">x</div>' +
            '<div style="color: red; font-family: &quot;Inter&quot;;">y</div>' +
            '<span style="color: blue;">z</span>' +
            '</foreignObject></svg>';

        const out = dedupeSvgInlineStyles(svg);

        expect(out).not.toContain(' style="');
        expect(out).toContain('<div class="a" data-s="0">x</div>');
        expect(out).toContain('<div data-s="0">y</div>');
        expect(out).toContain('<span data-s="1">z</span>');
        expect(out).toContain(
            '<svg xmlns="http://www.w3.org/2000/svg" width="10"><style>' +
                '[data-s="0"]{color: red; font-family: "Inter";}' +
                '[data-s="1"]{color: blue;}</style>'
        );
    });

    it('returns input unchanged when there are no inline styles', () => {
        const svg = '<svg><rect/></svg>';
        expect(dedupeSvgInlineStyles(svg)).toBe(svg);
    });

    it('XML-escapes markup characters inside style values', () => {
        const out = dedupeSvgInlineStyles(
            '<svg><a style="content: &quot;&lt;/style&gt;&quot;;"/></svg>'
        );
        expect(out).toContain(
            '<style>[data-s="0"]{content: "&lt;/style&gt;";}</style>'
        );
    });

    it('produces well-formed XML', () => {
        const out = dedupeSvgInlineStyles(
            '<svg xmlns="http://www.w3.org/2000/svg"><g style="fill: rgb(1, 2, 3);"/></svg>'
        );
        const doc = new DOMParser().parseFromString(out, 'image/svg+xml');
        expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
        expect(doc.querySelector('style')?.textContent).toBe(
            '[data-s="0"]{fill: rgb(1, 2, 3);}'
        );
    });
});

describe('dedupeSvgDataUrlStyles', () => {
    it('round-trips a utf-8 SVG data URL', () => {
        const svg = '<svg><g style="fill: red;"/><g style="fill: red;"/></svg>';
        const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        const out = dedupeSvgDataUrlStyles(url);
        expect(out.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
        expect(decodeURIComponent(out.split(',')[1])).toBe(
            dedupeSvgInlineStyles(svg)
        );
    });

    it('leaves non-SVG or base64 data URLs untouched', () => {
        expect(dedupeSvgDataUrlStyles('data:image/png;base64,AAAA')).toBe(
            'data:image/png;base64,AAAA'
        );
        expect(dedupeSvgDataUrlStyles('data:image/svg+xml;base64,AAAA')).toBe(
            'data:image/svg+xml;base64,AAAA'
        );
    });
});
