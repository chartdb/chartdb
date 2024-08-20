export const minimizeQuery = (query: string) => {
    return query
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
        .trim(); // Remove leading and trailing spaces
};
