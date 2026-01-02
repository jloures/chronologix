/**
 * Chronologix Cryptography Service
 * Uses Web Crypto API for zero-knowledge encryption.
 * Algorithm: AES-GCM 256-bit
 * Key Derivation: PBKDF2-HMAC-SHA256 (600,000 iterations)
 */

export const ALGORITHM = "AES-GCM";
export const KDF_ITERATIONS = 600000;
export const SALT_LENGTH = 16;
export const IV_LENGTH = 12;

/**
 * Generates a random 16-byte salt for key derivation.
 */
export function generateSalt(): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2.
 * @param password The user's plaintext password
 * @param salt The global random salt
 */
export async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );

    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt as any,
            iterations: KDF_ITERATIONS,
            hash: "SHA-256",
        },
        passwordKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypts data using AES-GCM.
 * @param data The JSON object or string to encrypt
 * @param key The derived CryptoKey
 * @returns Object containing the ciphertext and IV
 */
export async function encryptData(data: any, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const enc = new TextEncoder();
    const encoded = enc.encode(JSON.stringify(data));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    const ciphertext = await window.crypto.subtle.encrypt(
        {
            name: ALGORITHM,
            iv: iv as any,
        },
        key,
        encoded
    );

    return { ciphertext, iv };
}

/**
 * Decrypts data using AES-GCM.
 * @param ciphertext The encrypted ArrayBuffer
 * @param key The derived CryptoKey
 * @param iv The initialization vector
 * @returns The decrypted data as a JSON object
 */
export async function decryptData(ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<any> {
    try {
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: ALGORITHM,
                iv: iv as any,
            },
            key,
            ciphertext
        );

        const dec = new TextDecoder();
        return JSON.parse(dec.decode(decrypted));
    } catch (error) {
        throw new Error("Decryption failed: Invalid key or corrupted data");
    }
}

// --- Helpers for Storage/JSON ---

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}
