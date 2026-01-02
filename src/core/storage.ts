import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface ChronologixDB extends DBSchema {
    meta: {
        key: string;
        value: any;
    };
    entries: {
        key: string; // Date string: "YYYY-MM-DD"
        value: {
            ciphertext: ArrayBuffer;
            iv: Uint8Array;
        };
    };
}

const DB_NAME = 'chronologix-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ChronologixDB>>;

export function initDB() {
    if (!dbPromise) {
        dbPromise = openDB<ChronologixDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('meta')) {
                    db.createObjectStore('meta');
                }
                if (!db.objectStoreNames.contains('entries')) {
                    db.createObjectStore('entries');
                }
            },
        });
    }
    return dbPromise;
}

export async function getGlobalSalt(): Promise<Uint8Array | null> {
    const db = await initDB();
    const salt = await db.get('meta', 'salt');
    return salt as Uint8Array || null;
}

export async function saveGlobalSalt(salt: Uint8Array): Promise<void> {
    const db = await initDB();
    await db.put('meta', salt, 'salt');
}

export interface EncryptedEntry {
    ciphertext: ArrayBuffer;
    iv: Uint8Array;
}

export async function getEntry(date: string): Promise<EncryptedEntry | undefined> {
    const db = await initDB();
    return db.get('entries', date);
}

export async function saveEntry(date: string, entry: EncryptedEntry): Promise<void> {
    const db = await initDB();
    await db.put('entries', entry, date);
}

export async function getAllEntries(): Promise<string[]> {
    const db = await initDB();
    return db.getAllKeys('entries');
}

export async function getAllData(): Promise<{ date: string; entry: EncryptedEntry }[]> {
    const db = await initDB();
    const keys = await db.getAllKeys('entries');
    const values = await db.getAll('entries');
    return keys.map((key, i) => ({ date: key, entry: values[i] }));
}

/**
 * Clears the entire database (Danger Zone)
 */
export async function clearDatabase(): Promise<void> {
    const db = await initDB();
    await db.clear('entries');
    await db.clear('meta');
}
