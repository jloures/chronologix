import { cn } from '../lib/utils';
// import type { EncryptedEntry } from '../core/storage';

interface CalendarProps {
    currentDate: Date;
    entries: Record<string, string>; // date -> decrypted_preview or just boolean? 
    // Wait, if we decrypt here, we can pass a map of date -> metadata/content
    // For now let's just pass "dates with entries" and maybe handle decryption in parent
    onDateClick: (date: string) => void;
}

export const Calendar = ({ currentDate, entries, onDateClick }: CalendarProps) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const getIsoDate = (day: number) => {
        return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-2xl font-bold">{currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="grid grid-cols-7 text-center border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>
            <div className="grid grid-cols-7 bg-muted/10">
                {days.map((day, idx) => {
                    if (day === null) return <div key={`empty-${idx}`} className="h-32 border-b border-border border-r border-muted/20" />;

                    const dateKey = getIsoDate(day);
                    const hasEntry = entries[dateKey];

                    return (
                        <div
                            key={day}
                            onClick={() => onDateClick(dateKey)}
                            className={cn(
                                "h-32 p-2 border-b border-border border-r border-muted/20 relative group cursor-pointer transition-colors hover:bg-muted/30",
                                "flex flex-col justify-between"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                                    hasEntry ? "bg-foreground text-background" : "text-muted-foreground"
                                )}>
                                    {day}
                                </span>
                            </div>

                            {hasEntry && (
                                <div className="mt-1 text-[10px] leading-tight text-muted-foreground line-clamp-3 px-1">
                                    {/* We could show a snippet if we had it, or just a marker */}
                                    <div className="w-full h-1.5 rounded-full bg-indigo-500/50 mb-1" />
                                    <span className="opacity-70 font-mono">ENCRYPTED</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
