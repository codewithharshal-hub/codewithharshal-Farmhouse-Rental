import { useEffect, useState } from "react";
import api, { getError } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/format";

export default function UsersTab() {
    const { user: me } = useAuth();
    const [search, setSearch] = useState("");
    const [applied, setApplied] = useState("");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ users: [], pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const params = { page };
                if (applied) params.search = applied;
                const { data } = await api.get("/admin/users", { params });
                if (!cancelled) setResult(data);
            } catch (err) {
                if (!cancelled) setError(getError(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [applied, page]);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        setApplied(search.trim());
    }

    async function toggleBlock(u) {
        const next = !u.isBlocked;
        if (next && !window.confirm(`Block ${u.name}? They will not be able to log in.`)) return;

        setError("");
        setNotice("");
        setBusyId(u._id);
        try {
            const { data } = await api.put(`/admin/users/${u._id}/block`, { isBlocked: next });
            setResult((prev) => ({
                ...prev,
                users: prev.users.map((x) => (x._id === u._id ? data.user : x)),
            }));
            setNotice(`${u.name} ${next ? "blocked" : "unblocked"}.`);
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    const users = result.users || [];

    return (
        <div>
            <form className="search-row" onSubmit={handleSearch}>
                <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email" aria-label="Search users" />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
                {applied && (
                    <button type="button" className="btn btn-outline btn-sm"
                        onClick={() => { setSearch(""); setApplied(""); setPage(1); }}>
                        Clear
                    </button>
                )}
            </form>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 200, marginTop: 16 }} />
            ) : users.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🔍</div>
                    <h3>No users found</h3>
                </div>
            ) : (
                <>
                    <p className="muted results-count">{result.total} user{result.total === 1 ? "" : "s"}</p>
                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => {
                                    const isMe = u._id === me?.id;
                                    const canBlock = !isMe && u.role !== "admin";

                                    return (
                                        <tr key={u._id}>
                                            <td>{u.name}{isMe && <span className="muted"> (you)</span>}</td>
                                            <td>{u.email}</td>
                                            <td>{u.phone || "-"}</td>
                                            <td><span className={`badge ${u.role === "admin" ? "confirmed" : ""}`}>{u.role}</span></td>
                                            <td>{formatDate(u.createdAt)}</td>
                                            <td>
                                                <span className={`badge ${u.isBlocked ? "rejected" : "confirmed"}`}>
                                                    {u.isBlocked ? "blocked" : "active"}
                                                </span>
                                            </td>
                                            <td>
                                                {canBlock && (
                                                    <button type="button"
                                                        className={`btn btn-sm ${u.isBlocked ? "btn-outline" : "btn-danger"}`}
                                                        disabled={busyId === u._id} onClick={() => toggleBlock(u)}>
                                                        {u.isBlocked ? "Unblock" : "Block"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {result.pages > 1 && (
                <div className="pagination">
                    <button type="button" className="btn btn-outline btn-sm"
                        disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
                    <span>Page {page} of {result.pages}</span>
                    <button type="button" className="btn btn-outline btn-sm"
                        disabled={page >= result.pages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
}