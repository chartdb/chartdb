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
