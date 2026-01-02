import React, { useRef } from 'react';
import { useSecurity } from '../context/SecurityContext';
import { exportData, importData } from '../utils/backup';
import { Lock, Download, Upload, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';

export const Layout = ({ children }: { children: React.ReactNode }) => {
    const { lockVault, isAuthenticated } = useSecurity();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (confirm("Importing will OVERWRITE your current vault. Are you sure?")) {
                try {
                    await importData(file);
                    alert("Import successful. Please log in with the backup's password.");
                    window.location.reload();
                } catch (err: any) {
                    alert("Import failed: " + err.message);
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <header className="border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center text-background font-bold text-lg">
                            C
                        </div>
                        <h1 className="text-xl font-bold tracking-tight">Chronologix</h1>
                    </div>

                    {isAuthenticated && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => exportData()}
                                className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Export Encrypted Backup"
                            >
                                {/* Fallback text if Lucide not available or simple SVG */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" /><line x1="12" x2="12" y1="3" /></svg>
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Import Backup"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" /><line x1="12" x2="12" y1="15" /></svg>
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleImport}
                            />

                            <div className="h-4 w-px bg-border mx-2"></div>

                            <button
                                onClick={lockVault}
                                className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground rounded-md transition-all font-medium text-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                Lock Vault
                            </button>
                        </div>
                    )}
                </div>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
};
