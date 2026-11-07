import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HelpButton from "./components/HelpButton";
import ProtectedRoute from "./components/ProtectedRoute";
import { FavoritesProvider } from "./context/FavoritesContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Farmhouses from "./pages/Farmhouses";
import FarmhouseDetails from "./pages/FarmhouseDetails";
import AddFarmhouse from "./pages/AddFarmhouse";
import EditFarmhouse from "./pages/EditFarmhouse";
import MyListings from "./pages/MyListings";
import MyBookings from "./pages/MyBookings";
import BookingRequests from "./pages/BookingRequests";
import BecomeHost from "./pages/BecomeHost";
import Favorites from "./pages/Favorites";
import Notifications from "./pages/Notifications";
import Assistant from "./pages/Assistant";
import MapPage from "./pages/MapPage";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import MyTickets from "./pages/MyTickets";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import AdminPanel from "./pages/admin/AdminPanel";
import AdminLogin from "./pages/admin/AdminLogin";
import NotFound from "./pages/NotFound";
import BookingDetails from "./pages/BookingDetails";

// sirf host
const host = (page) => <ProtectedRoute hostOnly>{page}</ProtectedRoute>;

// user aur host, admin nahi
const member = (page) => <ProtectedRoute noAdmin>{page}</ProtectedRoute>;

export default function App() {
    return (
        <NotificationsProvider>
            <FavoritesProvider>
                <div className="layout">
                    <Navbar />
                    <main className="main">
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password/:token" element={<ResetPassword />} />

                            <Route path="/farmhouses" element={<Farmhouses />} />
                            <Route path="/farmhouses/new" element={host(<AddFarmhouse />)} />
                            <Route path="/farmhouses/:id/edit" element={host(<EditFarmhouse />)} />
                            <Route path="/farmhouses/:id" element={<FarmhouseDetails />} />

                            <Route path="/become-host" element={member(<BecomeHost />)} />
                            <Route path="/my-listings" element={host(<MyListings />)} />
                            <Route path="/booking-requests" element={host(<BookingRequests />)} />

                            <Route path="/my-bookings" element={member(<MyBookings />)} />
                            <Route path="/bookings/:id" element={member(<BookingDetails />)} />
                            <Route path="/favorites" element={member(<Favorites />)} />
                            <Route path="/notifications" element={member(<Notifications />)} />

                            <Route path="/assistant" element={<Assistant />} />
                            <Route path="/map" element={<MapPage />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/help" element={<Help />} />

                            <Route path="/support" element={member(<MyTickets />)} />
                            <Route path="/support/new" element={member(<NewTicket />)} />
                            <Route path="/support/:id" element={member(<TicketDetail />)} />

                            <Route path="/admin-login" element={<AdminLogin />} />
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute adminOnly>
                                        <AdminPanel />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </main>
                    <Footer />
                    <HelpButton />
                </div>
            </FavoritesProvider>
        </NotificationsProvider>
    );
}