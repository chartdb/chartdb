import { Parser } from '@dbml/core';
import { preprocessDBML, sanitizeDBML } from './dbml-import';
import type { DBMLError } from './dbml-import-error';
import {
    parseDBMLError,
    validateArrayTypesForDatabase,
} from './dbml-import-error';
import type { DatabaseType } from '@/lib/domain/database-type';

export const verifyDBML = (
    content: string,
    {
        databaseType,
    }: {
        databaseType: DatabaseType;
    }
):
    | {
          hasError: true;
          error: unknown;
          parsedError?: DBMLError;
          errorText: string;
      }
    | {
          hasError: false;
      } => {
    try {
        // Validate array types BEFORE preprocessing (preprocessing removes [])
        validateArrayTypesForDatabase(content, databaseType);

        const { content: preprocessedContent } = preprocessDBML(content);
        const sanitizedContent = sanitizeDBML(preprocessedContent);

        const parser = new Parser();
        parser.parse(sanitizedContent, 'dbmlv2');
    } catch (e) {
        const parsedError = parseDBMLError(e);
        if (parsedError) {
            return {
                hasError: true,
                parsedError: parsedError,
                error: e,
                errorText: parsedError.message,
            };
        } else {
            if (e instanceof Error) {
                return {
                    hasError: true,
                    error: e,
                    errorText: e.message,
                };
            }

            return {
                hasError: true,
                error: e,
                errorText: JSON.stringify(e),
            };
        }
    }

    return {
        hasError: false,
    };
};
