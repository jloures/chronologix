import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

interface EntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string; // YYYY-MM-DD
    initialContent: string;
    onSave: (date: string, data: { content: string, mood: string }) => Promise<void>;
}

const MOODS = [
    { id: 'neutral', label: 'Neutral', color: 'bg-zinc-400' },
    { id: 'happy', label: 'Happy', color: 'bg-green-500' },
    { id: 'sad', label: 'Sad', color: 'bg-blue-500' },
    { id: 'productive', label: 'Productive', color: 'bg-purple-500' },
    { id: 'stressed', label: 'Stressed', color: 'bg-red-500' },
];

export const EntryModal = ({ isOpen, onClose, date, initialContent, onSave }: EntryModalProps) => {
    const [content, setContent] = useState('');
    const [mood, setMood] = useState('neutral');
    const [isPreview, setIsPreview] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Try to parse initial content if it's JSON, otherwise treat as string (legacy)
        try {
            if (!initialContent) {
                setContent('');
                setMood('neutral');
                return;
            }
            const parsed = JSON.parse(initialContent);
            if (typeof parsed === 'object' && parsed !== null) {
                setContent(parsed.content || '');
                setMood(parsed.mood || 'neutral');
            } else {
                setContent(initialContent);
                setMood('neutral');
            }
        } catch {
            setContent(initialContent);
            setMood('neutral');
        }
    }, [initialContent, date]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(date, { content, mood });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <div className="bg-card w-full max-w-2xl h-[80vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div>
                        <h2 className="text-lg font-semibold">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                        <p className="text-xs text-muted-foreground">Secure Entry</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsPreview(!isPreview)}
                            className="text-sm px-3 py-1.5 rounded-md hover:bg-secondary transition-colors"
                        >
                            {isPreview ? 'Edit' : 'Preview'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-sm px-3 py-1.5 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Mood Selector - Toolbar */}
                {!isPreview && (
                    <div className="px-4 py-2 border-b border-border bg-muted/10 flex items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">Mood:</span>
                        <div className="flex gap-2">
                            {MOODS.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMood(m.id)}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-background ring-foreground/20",
                                        m.color,
                                        mood === m.id && "ring-2 ring-foreground scale-110"
                                    )}
                                    title={m.label}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* content */}
                <div className="flex-1 overflow-hidden relative">
                    {isPreview ? (
                        <div className="prose prose-invert max-w-none p-6 overflow-y-auto h-full text-foreground">
                            <ReactMarkdown>{content || "*No entry...*"}</ReactMarkdown>
                        </div>
                    ) : (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full bg-transparent p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                            placeholder="Write your thoughts..."
                            autoFocus
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border flex justify-end bg-muted/30">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2 bg-foreground text-background font-semibold rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isSaving ? 'Encrypting...' : 'Save Encrypted Entry'}
                    </button>
                </div>
            </div>
        </div>
    );
};
