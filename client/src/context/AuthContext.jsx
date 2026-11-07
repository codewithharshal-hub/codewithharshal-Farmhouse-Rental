import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
    });

    // page khulte hi server se sahi role le aate hain
    useEffect(() => {
        if (!localStorage.getItem("token")) return;

        let cancelled = false;

        api.get("/auth/me")
            .then(({ data }) => {
                if (cancelled) return;
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
            })
            .catch(() => { });

        return () => {
            cancelled = true;
        };
    }, []);

    function saveSession(data) {
        const newUser = data.user || {
            _id: data._id,
            name: data.name,
            email: data.email,
            role: data.role,
        };
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(newUser));
        setUser(newUser);
    }

    async function login(email, password) {
        const { data } = await api.post("/auth/login", { email, password });
        if (!data.token) throw new Error("Login failed: no token received.");
        saveSession(data);
        return data;
    }

    async function adminLogin(email, password) {
        const { data } = await api.post("/auth/admin-login", { email, password });
        if (!data.token) throw new Error("Login failed: no token received.");
        saveSession(data);
        return data;
    }

    async function register(form) {
        const { data } = await api.post("/auth/register", form);
        if (data.token) saveSession(data);
        return data;
    }

    // user ko host banata hai (token wahi rehta hai, sirf role badalta hai)
    async function becomeHost(phone) {
        const { data } = await api.post("/auth/become-host", { phone, agree: true });
        const updated = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        return data;
    }

    function logout() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAdmin: user?.role === "admin",
                isHost: user?.role === "host",
                login,
                adminLogin,
                register,
                becomeHost,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    return useContext(AuthContext);
}