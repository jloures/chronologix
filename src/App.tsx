import { useState, useEffect } from 'react';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { Layout } from './components/Layout';
import { Calendar } from './components/Calendar';
import { EntryModal } from './components/EntryModal';
import { encryptData, decryptData } from './core/crypto';
import { saveEntry, getAllData } from './core/storage';
import { Loader2 } from 'lucide-react';

function Dashboard() {
  const { activeKey } = useSecurity();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calendarData, setCalendarData] = useState<Record<string, string>>({});
  // In a real app we would store decrypted payloads in a secure memory store, 
  // but for simplicity we decrypt on load and keep in React state.
  // Warning: This stays in memory. On lock, component unmounts -> state cleared. Correct.

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!activeKey) return;
    setIsLoading(true);
    try {
      const raw = await getAllData();
      const decryptedMap: Record<string, string> = {};

      await Promise.all(raw.map(async (item) => {
        try {
          const decrypted = await decryptData(item.entry.ciphertext, activeKey, item.entry.iv);
          // Store the full JSON string to pass to EntryModal
          decryptedMap[item.date] = JSON.stringify(decrypted);
        } catch (e) {
          console.error(`Failed to decrypt entry for ${item.date}`, e);
          decryptedMap[item.date] = JSON.stringify({ content: "Error decrypting", mood: 'neutral' });
        }
      }));

      setCalendarData(decryptedMap);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeKey]);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveEntry = async (date: string, data: { content: string, mood: string }) => {
    if (!activeKey) return;
    const { ciphertext, iv } = await encryptData(data, activeKey);
    await saveEntry(date, { ciphertext, iv });

    // Optimistic update
    setCalendarData(prev => ({
      ...prev,
      [date]: JSON.stringify(data)
    }));
  };

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate stats logic or mood maps could go here if requested
  // For now just pass dates

  return (
    <div>
      <Calendar
        currentDate={new Date()}
        entries={calendarData}
        onDateClick={handleDateClick}
      />

      {selectedDate && (
        <EntryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          initialContent={calendarData[selectedDate] || ''}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}

function PasswordInput({ onSubmit, isSetup, error }: { onSubmit: (pw: string) => void, isSetup: boolean, error?: string }) {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const checkStrength = (val: string) => {
    let s = 0;
    if (val.length > 8) s++;
    if (val.length > 12) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    setStrength(s);
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <h2 className="text-2xl font-bold text-center">
        {isSetup ? "Unlock Vault" : "Setup New Vault"}
      </h2>
      <p className="text-center text-muted-foreground text-sm mb-4">
        {isSetup
          ? "Enter your password to access your secure diary."
          : "Create a strong password. It cannot be recovered if lost."}
      </p>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(password); }} className="space-y-4">
        <div className="space-y-2">
          <input
            type="password"
            className="w-full bg-input border border-border rounded-md px-3 py-2 focus:ring-2 ring-primary outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); if (!isSetup) checkStrength(e.target.value); }}
            autoFocus
          />
          {!isSetup && password.length > 0 && (
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength < 2 ? 'bg-red-500 w-1/4' :
                    strength < 4 ? 'bg-yellow-500 w-1/2' :
                      'bg-green-500 w-full'
                  }`}
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          className="w-full bg-foreground text-background font-bold py-2 rounded-md hover:opacity-90 transition-opacity"
          disabled={!password}
        >
          {isSetup ? "Unlock" : "Create Vault"}
        </button>
      </form>
    </div>
  );
}

function AppContent() {
  const { isLoading, isSetup, isAuthenticated, setupVault, unlockVault } = useSecurity();
  const [error, setError] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const handleAuth = async (pw: string) => {
      setError('');
      try {
        if (isSetup) {
          await unlockVault(pw);
        } else {
          await setupVault(pw);
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <PasswordInput isSetup={isSetup} onSubmit={handleAuth} error={error} />
      </div>
    );
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

function App() {
  return (
    <SecurityProvider>
      <AppContent />
    </SecurityProvider>
  );
}

export default App;
