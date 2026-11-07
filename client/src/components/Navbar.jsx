import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const ROLE_LABEL = { user: "Guest account", host: "Host account", admin: "Admin account" };

export default function Navbar() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const role = user?.role;
    const isHost = role === "host";
    const isAdmin = role === "admin";

    useEffect(() => {
        function onClickOutside(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const close = () => {
        setOpen(false);
        setMenuOpen(false);
    };

    function handleLogout() {
        logout();
        close();
        navigate("/");
    }

    return (
        <header className="navbar">
            <div className="container nav-inner">
                <Link to="/" className="brand" onClick={close}>
                    🏡 Farmhouse Rental
                </Link>

                <button
                    type="button"
                    className="menu-btn"
                    onClick={() => setOpen(!open)}
                    aria-label="Toggle menu"
                >
                    {open ? "✕" : "☰"}
                </button>

                <nav className={`nav-links ${open ? "open" : ""}`}>
                    <NavLink to="/" end onClick={close}>Home</NavLink>
                    <NavLink to="/farmhouses" end onClick={close}>Farmhouses</NavLink>
                    <NavLink to="/assistant" onClick={close}>✨ AI Finder</NavLink>
                    <NavLink to="/map" onClick={close}>🗺 Map</NavLink>

                    {isHost && <NavLink to="/farmhouses/new" onClick={close}>List farmhouse</NavLink>}
                    {!isHost && !isAdmin && (
                        <NavLink to="/become-host" onClick={close}>Become a host</NavLink>
                    )}

                    <NavLink to="/contact" onClick={close}>Contact</NavLink>
                    <NavLink to="/help" onClick={close}>Help</NavLink>

                    {user ? (
                        <>
                            {!isAdmin && <NotificationBell />}

                            <div className="account" ref={menuRef}>
                                <button
                                    type="button"
                                    className="account-btn"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    aria-expanded={menuOpen}
                                >
                                    Hi, {user.name?.split(" ")[0] || "there"} ▾
                                </button>

                                {menuOpen && (
                                    <div className="account-menu">
                                        <div className="role-tag">{ROLE_LABEL[role] || "Account"}</div>

                                        {isAdmin ? (
                                            <Link to="/admin" onClick={close}>Admin panel</Link>
                                        ) : (
                                            <>
                                                <Link to="/my-bookings" onClick={close}>My bookings</Link>
                                                <Link to="/favorites" onClick={close}>Favorites</Link>

                                                {isHost ? (
                                                    <>
                                                        <Link to="/my-listings" onClick={close}>My listings</Link>
                                                        <Link to="/booking-requests" onClick={close}>Booking requests</Link>
                                                    </>
                                                ) : (
                                                    <Link to="/become-host" onClick={close}>Become a host</Link>
                                                )}

                                                <Link to="/notifications" onClick={close}>Notifications</Link>
                                                <Link to="/support" onClick={close}>My tickets</Link>
                                            </>
                                        )}

                                        <button type="button" onClick={handleLogout}>Logout</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" onClick={close}>Login</NavLink>
                            <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>
                                Sign up
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}