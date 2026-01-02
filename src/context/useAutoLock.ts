import { useEffect, useRef, useCallback } from 'react';

const EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function useAutoLock(
    isAuthenticated: boolean,
    lockFn: () => void,
    timeoutMs: number = 10 * 60 * 1000 // 10 minutes
) {
    const timerRef = useRef<ReturnType<typeof setTimeout> | number>(0);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (isAuthenticated) {
            timerRef.current = setTimeout(() => {
                console.log("Auto-lock triggered due to inactivity");
                lockFn();
            }, timeoutMs);
        }
    }, [isAuthenticated, lockFn, timeoutMs]);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Initial start
        resetTimer();

        const handleActivity = () => {
            resetTimer();
        };

        // Add listeners
        EVENTS.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            // Cleanup
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            EVENTS.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isAuthenticated, resetTimer]);
}
