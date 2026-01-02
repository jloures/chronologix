import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateSalt, deriveKey, encryptData, decryptData } from '../core/crypto';
import { getGlobalSalt, saveGlobalSalt, initDB } from '../core/storage';
import { useAutoLock } from './useAutoLock';

interface SecurityContextType {
    isAuthenticated: boolean;
    isSetup: boolean;
    isLoading: boolean; // Initial check for setup
    activeKey: CryptoKey | null;
    setupVault: (password: string) => Promise<void>;
    unlockVault: (password: string) => Promise<void>;
    lockVault: () => void;
}

const SecurityContext = createContext<SecurityContextType | null>(null);

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isSetup, setIsSetup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeKey, setActiveKey] = useState<CryptoKey | null>(null);

    // Check if vault is set up (salt exists)
    useEffect(() => {
        const checkSetup = async () => {
            try {
                const salt = await getGlobalSalt();
                setIsSetup(!!salt);
            } catch (e) {
                console.error("Failed to check DB:", e);
            } finally {
                setIsLoading(false);
            }
        };
        checkSetup();
    }, []);

    const lockVault = React.useCallback(() => {
        setActiveKey(null);
        setIsAuthenticated(false);
        // Force garbage collection hint (not reachable in JS, but clearing ref helps)
    }, []);

    // Initialize Auto-Lock
    useAutoLock(isAuthenticated, lockVault);

    const setupVault = async (password: string) => {
        const salt = generateSalt();
        const key = await deriveKey(password, salt);

        // Create a validator to verify password later
        // Encrypt a known string. If we can decrypt it later, password is correct.
        const validatorPayload = "CHRONOLOGIX_VALID";
        const { ciphertext, iv } = await encryptData(validatorPayload, key);

        // Save everything
        await saveGlobalSalt(salt);

        // Save validator
        const db = await initDB();
        await db.put('meta', { ciphertext, iv }, 'validator');

        setActiveKey(key);
        setIsSetup(true);
        setIsAuthenticated(true);
    };

    const unlockVault = async (password: string) => {
        const salt = await getGlobalSalt();
        if (!salt) throw new Error("Vault not set up");

        const key = await deriveKey(password, salt);

        // Verify key
        const db = await initDB();
        const validator = await db.get('meta', 'validator');

        if (!validator) {
            // Legacy or broken state? Assume valid for now if no validator? 
            // STRICT MODE: Fail. But for MVP let's re-create validator if missing?
            // Actually, if we just set it up, it should be there.
            // If it's missing, maybe correct password but data corruption.
            // Let's assume it MUST be there.
            throw new Error("Vault integrity check failed (missing validator).");
        }

        try {
            const decrypted = await decryptData(validator.ciphertext, key, validator.iv);
            if (decrypted !== "CHRONOLOGIX_VALID") {
                throw new Error("Invalid password");
            }
        } catch (e) {
            throw new Error("Invalid password");
        }

        setActiveKey(key);
        setIsAuthenticated(true);
    };

    return (
        <SecurityContext.Provider value={{
            isAuthenticated,
            isSetup,
            isLoading,
            activeKey,
            setupVault,
            unlockVault,
            lockVault
        }}>
            {children}
        </SecurityContext.Provider>
    );
};

export const useSecurity = () => {
    const context = useContext(SecurityContext);
    if (!context) {
        throw new Error("useSecurity must be used within a SecurityProvider");
    }
    return context;
};
