import { formatPrice } from "../../utils/format";

export default function StatsTab({ stats, error, onNavigate }) {
    if (error) {
        return <div className="alert alert-error" role="alert">{error}</div>;
    }

    if (!stats) {
        return (
            <div className="stat-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div className="skeleton" style={{ height: 96 }} key={i} />
                ))}
            </div>
        );
    }

    const cards = [
        { label: "Pending approval", value: stats.pendingFarmhouses, icon: "⏳", go: "farmhouses", highlight: stats.pendingFarmhouses > 0 },
        { label: "New messages", value: stats.newMessages, icon: "✉️", go: "messages", highlight: stats.newMessages > 0 },
        { label: "Open tickets", value: stats.openTickets, icon: "🎧", go: "support", highlight: stats.openTickets > 0 },
        { label: "Users", value: stats.totalUsers, icon: "👥", go: "users" },
        { label: "Total farmhouses", value: stats.totalFarmhouses, icon: "🏡", go: "farmhouses" },
        { label: "Approved farmhouses", value: stats.approvedFarmhouses, icon: "✅", go: "farmhouses" },
        { label: "Rejected farmhouses", value: stats.rejectedFarmhouses, icon: "⛔", go: "farmhouses" },
        { label: "Total bookings", value: stats.totalBookings, icon: "📅" },
        { label: "Pending bookings", value: stats.pendingBookings, icon: "🕒" },
        { label: "Confirmed bookings", value: stats.confirmedBookings, icon: "🎉" },
        { label: "Confirmed booking value", value: formatPrice(stats.confirmedValue), icon: "💰" },
    ];

    return (
        <div className="stat-grid">
            {cards.map((c) => {
                const Tag = c.go ? "button" : "div";
                return (
                    <Tag key={c.label} type={c.go ? "button" : undefined}
                        className={`stat-card ${c.highlight ? "highlight" : ""} ${c.go ? "clickable" : ""}`}
                        onClick={c.go ? () => onNavigate(c.go) : undefined}>
                        <span className="stat-icon">{c.icon}</span>
                        <span className="stat-value">{c.value}</span>
                        <span className="stat-label">{c.label}</span>
                    </Tag>
                );
            })}
        </div>
    );
}