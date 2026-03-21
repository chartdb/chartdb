import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

export const encryptJson = (value: unknown, key: Buffer): string => {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(value), 'utf8'),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return JSON.stringify({
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        payload: encrypted.toString('base64'),
    });
};

export const decryptJson = <T>(payload: string, key: Buffer): T => {
    const parsed = JSON.parse(payload) as {
        iv: string;
        tag: string;
        payload: string;
    };

    const decipher = createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(parsed.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(parsed.payload, 'base64')),
        decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8')) as T;
};
