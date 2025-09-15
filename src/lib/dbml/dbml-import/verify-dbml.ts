import { Parser } from '@dbml/core';
import { preprocessDBML, sanitizeDBML } from './dbml-import';
import type { DBMLError } from './dbml-import-error';
import { parseDBMLError } from './dbml-import-error';

export const verifyDBML = (
    content: string
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
        const preprocessedContent = preprocessDBML(content);
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
