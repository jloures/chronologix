import { saveGlobalSalt, saveEntry, getAllData, clearDatabase, type EncryptedEntry, getGlobalSalt, initDB } from '../core/storage';
import { arrayBufferToBase64, base64ToArrayBuffer } from '../core/crypto';

export interface BackupData {
    version: number;
    salt: string; // Base64
    validator: { ciphertext: string; iv: string }; // Base64
    entries: {
        date: string;
        ciphertext: string; // Base64
        iv: string; // Base64
    }[];
}

export async function exportData(): Promise<void> {
    const salt = await getGlobalSalt();
    if (!salt) throw new Error("No vault to export");

    // Get validator
    const db = await initDB();
    const validator = await db.get('meta', 'validator');
    if (!validator) throw new Error("Vault corrupted: missing validator");

    const rawEntries = await getAllData();

    const backup: BackupData = {
        version: 1,
        salt: arrayBufferToBase64(salt),
        validator: {
            ciphertext: arrayBufferToBase64(validator.ciphertext),
            iv: arrayBufferToBase64(validator.iv)
        },
        entries: rawEntries.map(item => ({
            date: item.date,
            ciphertext: arrayBufferToBase64(item.entry.ciphertext),
            iv: arrayBufferToBase64(item.entry.iv),
        })),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronologix-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<void> {
    const text = await file.text();
    let data: BackupData;
    try {
        data = JSON.parse(text);
    } catch (e) {
        throw new Error("Invalid JSON file");
    }

    if (!data.salt || !data.entries || !data.validator) {
        throw new Error("Invalid backup format");
    }

    // Clear existing data
    await clearDatabase();

    // Restore Salt
    await saveGlobalSalt(new Uint8Array(base64ToArrayBuffer(data.salt)));

    // Restore Validator
    const db = await initDB();
    await db.put('meta', {
        ciphertext: base64ToArrayBuffer(data.validator.ciphertext),
        iv: new Uint8Array(base64ToArrayBuffer(data.validator.iv))
    }, 'validator');

    // Restore Entries
    for (const item of data.entries) {
        const entry: EncryptedEntry = {
            ciphertext: base64ToArrayBuffer(item.ciphertext),
            iv: new Uint8Array(base64ToArrayBuffer(item.iv)),
        };
        await saveEntry(item.date, entry);
    }
}
