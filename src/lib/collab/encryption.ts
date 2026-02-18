const ENCRYPTION_KEY_BITS = 128;
const IV_LENGTH_BYTES = 12;

export const generateEncryptionKey = async (): Promise<string> => {
    const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: ENCRYPTION_KEY_BITS },
        true,
        ['encrypt', 'decrypt']
    );
    const jwk = await window.crypto.subtle.exportKey('jwk', key);
    return jwk.k!;
};

const getCryptoKey = async (
    key: string,
    usage: KeyUsage
): Promise<CryptoKey> => {
    return window.crypto.subtle.importKey(
        'jwk',
        {
            alg: 'A128GCM',
            ext: true,
            k: key,
            key_ops: ['encrypt', 'decrypt'],
            kty: 'oct',
        },
        { name: 'AES-GCM', length: ENCRYPTION_KEY_BITS },
        false,
        [usage]
    );
};

const createIV = (): Uint8Array<ArrayBuffer> => {
    const arr = new Uint8Array(IV_LENGTH_BYTES);
    return window.crypto.getRandomValues(arr) as Uint8Array<ArrayBuffer>;
};

export const encryptData = async (
    key: string,
    data: string | object
): Promise<{ encryptedBuffer: ArrayBuffer; iv: Uint8Array<ArrayBuffer> }> => {
    const iv = createIV();
    const cryptoKey = await getCryptoKey(key, 'encrypt');
    const encoded =
        typeof data === 'string'
            ? new TextEncoder().encode(data)
            : new TextEncoder().encode(JSON.stringify(data));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoded
    );

    return { encryptedBuffer, iv };
};

export const decryptData = async (
    iv: Uint8Array<ArrayBuffer>,
    encrypted: ArrayBuffer,
    key: string
): Promise<string> => {
    const cryptoKey = await getCryptoKey(key, 'decrypt');
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encrypted
    );
    return new TextDecoder().decode(decrypted);
};
