import { isDatabaseMetadata } from './metadata-types/database-metadata';

export const fixMetadataJson = (metadataJson: string): string => {
    // Replace problematic array default values with null
    metadataJson = metadataJson.replace(
        /"default": "?'?\[[^\]]*\]'?"?(\\")?(,|\})/gs,
        '"default": null$2'
    );

    // Generic fix for all default values with '\ pattern - convert to just '
    metadataJson = metadataJson.replace(
        /"default":\s*"(.*?)'\\"(,|\})/g,
        '"default": "$1"$2'
    );

    // TODO: remove this temporary eslint disable
    return (
        metadataJson
            .trim()
            // First unescape the JSON string
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\')
            .replace(/^[^{]*/, '') // Remove everything before the first '{'
            .replace(/}[^}]*$/, '}') // Remove everything after the last '}'
            .replace(/:""([^"]+)""/g, ':"$1"') // Convert :""value"" to :"value"
            .replace(/""(\w+)""/g, '"$1"') // Convert ""key"" to "key"
            .replace(/^\s+|\s+$/g, '')
            .replace(/^"|"$/g, '')
            .replace(/^'|'$/g, '')
            .replace(/""""/g, '""') // Remove Quadruple quotes from keys
            .replace(/"""([^",}]+)"""/g, '"$1"') // Remove tripple quotes from keys
            .replace(/""([^",}]+)""/g, '"$1"') // Remove double quotes from keys

            .replace(/'"([^"]+)"'/g, '\\"$1\\"') // Replace single-quoted double quotes
            .replace(/'(".*?")'/g, "'\\$1'") // Handle cases like '"{}"'::json

            // Handle specific case for nextval with quoted identifiers
            .replace(
                /nextval\('(".*?")'::regclass\)/g,
                "nextval('\\$1'::regclass)"
            )

            // Handle cases like "'CHAT'::"CustomType"" (ensures existing quotes are escaped for JSON)
            /* eslint-disable-next-line no-useless-escape */
            .replace(/'([^']+)'::\"([^\"]+)\"/g, '\'$1\'::\\\"$2\\\"')

            // Convert string "null" to actual null for precision field
            .replace(/"precision": "null"/g, '"precision": null')

            // Convert string "true"/"false" to actual boolean for nullable field
            .replace(/"nullable": "false"/g, '"nullable": false')
            .replace(/"nullable": "true"/g, '"nullable": true')

            /* eslint-disable-next-line no-useless-escape */
            .replace(/\"/g, '___ESCAPED_QUOTE___') // Temporarily replace empty strings
            .replace(/(?<=:\s*)""(?=\s*[,}])/g, '___EMPTY___') // Temporarily replace empty strings
            .replace(/""/g, '"') // Replace remaining double quotes
            .replace(/___ESCAPED_QUOTE___/g, '"') // Restore empty strings
            .replace(/___EMPTY___/g, '""') // Restore empty strings
            .replace(/\n/g, '')
    );
};

export const isStringMetadataJson = (metadataJsonString: string): boolean => {
    let result = false;
    try {
        const parsedResult = JSON.parse(metadataJsonString);

        result = isDatabaseMetadata(parsedResult);
    } catch {
        result = false;
    }

    return result;
};

export const minimizeQuery = (query: string) => {
    if (!query) return '';

    // Split into lines, trim leading spaces from each line, then rejoin
    return query
        .split('\n')
        .map((line) => line.replace(/^\s+/, '')) // Remove only leading spaces
        .join('\n');
};
