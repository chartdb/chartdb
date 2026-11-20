/**
 * html-to-image inlines the full computed style on every element, which makes
 * large SVG exports huge (150 tables ~ 72 MB, #1083). Almost all of those
 * style strings are duplicates, so each unique one is hoisted into a single
 * CSS rule keyed by a `data-s` attribute.
 *
 * Inside the exported SVG no page stylesheets apply (html-to-image only
 * relies on inline styles plus its own pseudo-element rules), so moving a
 * style from inline to an attribute selector does not change the cascade:
 * each element matches exactly one of our rules.
 */
export const dedupeSvgInlineStyles = (svg: string): string => {
    const keyByStyle = new Map<string, string>();

    const body = svg.replace(/ style="([^"]*)"/g, (_match, style: string) => {
        let key = keyByStyle.get(style);
        if (!key) {
            key = keyByStyle.size.toString(36);
            keyByStyle.set(style, key);
        }
        return ` data-s="${key}"`;
    });

    if (keyByStyle.size === 0) return svg;

    const rules: string[] = [];
    keyByStyle.forEach((key, style) => {
        rules.push(`[data-s="${key}"]{${unescapeXmlAttr(style)}}`);
    });
    // XML-escape the CSS (instead of CDATA, which some parsers mishandle)
    const css = rules
        .join('')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    const styleTag = `<style>${css}</style>`;

    return body.replace(/<svg\b[^>]*>/, (open) => open + styleTag);
};

/** Same as {@link dedupeSvgInlineStyles} but for an SVG data URL. */
export const dedupeSvgDataUrlStyles = (dataUrl: string): string => {
    const comma = dataUrl.indexOf(',');
    const header = dataUrl.slice(0, comma);
    if (
        comma < 0 ||
        !header.startsWith('data:image/svg+xml') ||
        header.includes(';base64')
    ) {
        return dataUrl;
    }
    const svg = decodeURIComponent(dataUrl.slice(comma + 1));
    return `${header},${encodeURIComponent(dedupeSvgInlineStyles(svg))}`;
};

const unescapeXmlAttr = (value: string): string =>
    value
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
