import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const NotificationsContext = createContext(null);

const POLL_MS = 30000;

export function NotificationsProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id || null;

    const [state, setState] = useState({ userId: null, unread: 0 });

    // logout ke baad purane user ki ginti nahi dikhni chahiye
    const unread = state.userId === userId ? state.unread : 0;

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        async function fetchCount() {
            try {
                const { data } = await api.get("/notifications/unread-count");
                if (!cancelled) setState({ userId, unread: data.unread });
            } catch {
                // agli baar dobara koshish
            }
        }

        fetchCount();

        // har 30 second mein, sirf tab jab tab khula dikh raha ho
        const timer = setInterval(() => {
            if (document.visibilityState === "visible") fetchCount();
        }, POLL_MS);

        const onVisible = () => {
            if (document.visibilityState === "visible") fetchCount();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            cancelled = true;
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [userId]);

    // useCallback se ye function har render mein naya nahi banta (loop ki asli wajah yahi thi)
    const setUnread = useCallback(
        (count) => {
            if (userId) setState({ userId, unread: Math.max(0, count) });
        },
        [userId]
    );

    const value = useMemo(() => ({ unread, setUnread }), [unread, setUnread]);

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
    return useContext(NotificationsContext);
}