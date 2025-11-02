export const hashPassword = async (password: string): Promise<string> => {
    if (!password) {
        return '';
    }

    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(digest));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    if (typeof globalThis.crypto?.subtle !== 'undefined') {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(digest));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    if (typeof btoa !== 'undefined') {
        return btoa(password);
    }

    return password;
};

export const verifyPassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    const hashed = await hashPassword(password);
    return hashed === hash;
};
