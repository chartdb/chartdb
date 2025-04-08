export const minimizeQuery = (query: string) => {
    if (!query) return '';

    // Split into lines, trim leading spaces from each line, then rejoin
    return query
        .split('\n')
        .map((line) => line.replace(/^\s+/, '')) // Remove only leading spaces
        .join('\n');
};
