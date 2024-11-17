import { waitFor } from '@/lib/utils';
import { isDatabaseMetadata } from './metadata-types/database-metadata';

export const fixMetadataJson = async (
    metadataJson: string
): Promise<string> => {
    await waitFor(1000);

    // TODO: remove this temporary eslint disable
    return (
        metadataJson
            .trim()
            .replace(/^[^{]*/, '') // Remove everything before the first '{'
            .replace(/}[^}]*$/, '}') // Remove everything after the last '}'
            .replace(/^\s+|\s+$/g, '')
            .replace(/^"|"$/g, '')
            .replace(/^'|'$/g, '')
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
