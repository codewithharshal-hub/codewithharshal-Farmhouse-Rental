import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// adminOnly: sirf admin | hostOnly: sirf host | noAdmin: admin ko nahi (user aur host ko haan)
export default function ProtectedRoute({
    children,
    adminOnly = false,
    hostOnly = false,
    noAdmin = false,
}) {
    const { user } = useAuth();
    const location = useLocation();

    if (!user) {
        return (
            <Navigate
                to={adminOnly ? "/admin-login" : "/login"}
                state={{ from: location }}
                replace
            />
        );
    }

    if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

    if (hostOnly && user.role !== "host") {
        return <Navigate to={user.role === "admin" ? "/admin" : "/become-host"} replace />;
    }

    if (noAdmin && user.role === "admin") return <Navigate to="/admin" replace />;

    return children;
}