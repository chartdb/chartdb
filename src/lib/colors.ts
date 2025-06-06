export const colorOptions = [
    '#ff6363', // A brighter red.
    '#ff6b8a', // A vibrant pink.
    '#c05dcf', // A rich purple.
    '#b067e9', // A lighter purple.
    '#8a61f5', // A bold indigo.
    '#7175fa', // A lighter indigo.
    '#8eb7ff', // A sky blue.
    '#42e0c0', // A fresh aqua.
    '#4dee8a', // A mint green.
    '#9ef07a', // A lime green.
    '#ffe374', // A warm yellow.
    '#ff9f74', // A peachy orange.
];

export const randomColor = () => {
    return colorOptions[Math.floor(Math.random() * colorOptions.length)];
};

export const viewColor = '#b0b0b0';
export const materializedViewColor = '#7d7d7d';

export function charCodeToHex(char: string): string {
    return char.charCodeAt(0).toString(16).toUpperCase();
}

const COLORS = [
    'stroke-red-200',
    'stroke-orange-200',
    'stroke-amber-200',
    'stroke-yellow-200',
    'stroke-lime-200',
    'stroke-green-200',
    'stroke-emerald-200',
    'stroke-teal-200',
    'stroke-cyan-200',
    'stroke-sky-200',
    'stroke-blue-200',
    'stroke-indigo-200',
    'stroke-violet-200',
    'stroke-purple-200',
    'stroke-fuchsia-200',
    'stroke-pink-200',
    'stroke-rose-200',
    'stroke-slate-200',
    'stroke-gray-200',
    'stroke-zinc-200',
    'stroke-neutral-200',
];

export function getToColor(key: string): string {
    const len = key.length;
    const mod = COLORS.length;
    let idx: number;

    if (len === 1) {
        idx = key
            .slice(0, 2)
            .split('')
            .reduce(
                (sum, x) => sum + parseInt(charCodeToHex(x).slice(-1), 16),
                0
            );
        return COLORS[idx % mod];
    }

    idx = key.split('').reduce((acc, word) => {
        return (
            acc +
            word
                .slice(0, 8)
                .split('')
                .reduce(
                    (sum, x) => sum + parseInt(charCodeToHex(x).slice(-1), 16),
                    0
                )
        );
    }, 0);

    return COLORS[idx % mod];
}
