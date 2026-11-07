import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api, { getError } from "../services/api";
import { useAuth } from "./AuthContext";

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
    const { user } = useAuth();
    const userId = user?.id || null;

    const [state, setState] = useState({ userId: null, ids: [] });
    const [toast, setToast] = useState("");
    const toastTimer = useRef(null);
    const busy = useRef(new Set());

    // logout ke baad purane user ki list nahi dikhni chahiye
    const ready = Boolean(userId) && state.userId === userId;
    const ids = useMemo(() => (ready ? state.ids : []), [ready, state.ids]);

    useEffect(() => {
        if (!userId) return;

        let cancelled = false;

        api.get("/favorites/ids")
            .then(({ data }) => {
                if (!cancelled) setState({ userId, ids: data.ids });
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [userId]);

    useEffect(() => () => clearTimeout(toastTimer.current), []);

    function showToast(message) {
        setToast(message);
        clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(""), 2400);
    }

    const isFavorite = (farmhouseId) => ids.includes(farmhouseId);

    async function toggle(farmhouseId) {
        if (!userId || busy.current.has(farmhouseId)) return;

        busy.current.add(farmhouseId);

        const before = ids;
        const had = before.includes(farmhouseId);
        const after = had ? before.filter((i) => i !== farmhouseId) : [...before, farmhouseId];

        // pehle screen badal do, phir server ko batao
        setState({ userId, ids: after });

        try {
            if (had) await api.delete(`/favorites/${farmhouseId}`);
            else await api.post(`/favorites/${farmhouseId}`);

            showToast(had ? "Removed from favorites" : "Saved to favorites");
        } catch (err) {
            setState({ userId, ids: before }); // fail hua to wapas
            showToast(getError(err));
        } finally {
            busy.current.delete(farmhouseId);
        }
    }

    return (
        <FavoritesContext.Provider value={{ ids, ready, isFavorite, toggle }}>
            {children}
            {toast && (
                <div className="toast" role="status">
                    {toast}
                </div>
            )}
        </FavoritesContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFavorites() {
    return useContext(FavoritesContext);
}