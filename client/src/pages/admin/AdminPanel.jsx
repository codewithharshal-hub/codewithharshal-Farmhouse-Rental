import { useCallback, useEffect, useState } from "react";
import api, { getError } from "../../services/api";
import StatsTab from "./StatsTab";
import FarmhousesTab from "./FarmhousesTab";
import UsersTab from "./UsersTab";
import MessagesTab from "./MessagesTab";
import SupportTab from "./SupportTab";

export default function AdminPanel() {
    const [tab, setTab] = useState("overview");
    const [stats, setStats] = useState(null);
    const [statsError, setStatsError] = useState("");

    const loadStats = useCallback(async () => {
        try {
            const { data } = await api.get("/admin/dashboard");
            setStats(data);
            setStatsError("");
        } catch (err) {
            setStatsError(getError(err));
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const tabs = [
        ["overview", "Overview", 0],
        ["farmhouses", "Farmhouses", stats?.pendingFarmhouses || 0],
        ["users", "Users", 0],
        ["messages", "Messages", stats?.newMessages || 0],
        ["support", "Support", stats?.openTickets || 0],
    ];

    return (
        <div className="container section">
            <div className="page-head">
                <h1>Admin panel</h1>
                <p className="muted">Approve listings, manage users, read messages and answer support tickets.</p>
            </div>

            <div className="tabs">
                {tabs.map(([key, label, count]) => (
                    <button key={key} type="button"
                        className={`tab ${tab === key ? "active" : ""}`}
                        onClick={() => setTab(key)}>
                        {label}
                        {count > 0 && <span className="count">{count}</span>}
                    </button>
                ))}
            </div>

            <div className="admin-body">
                {tab === "overview" && (
                    <StatsTab stats={stats} error={statsError} onNavigate={setTab} />
                )}
                {tab === "farmhouses" && <FarmhousesTab onChange={loadStats} />}
                {tab === "users" && <UsersTab />}
                {tab === "messages" && <MessagesTab onChange={loadStats} />}
                {tab === "support" && <SupportTab onChange={loadStats} />}
            </div>
        </div>
    );
}