import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// har request ke saath token bhejo
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// token expire ho gaya to logout
api.interceptors.response.use(
    (res) => res,
    (error) => {
        if (
            error.response?.status === 401 &&
            localStorage.getItem("token") &&
            !error.config?.url?.startsWith("/auth/")
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// error se saaf message nikalne ke liye
export function getError(err) {
    if (err.code === "ERR_NETWORK") {
        return "Cannot reach the server. Make sure the backend is running.";
    }
    return (
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Something went wrong."
    );
}

export default api;