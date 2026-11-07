import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { getError } from "../services/api";
import FarmhouseForm from "../components/FarmhouseForm";

export default function EditFarmhouse() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [farmhouse, setFarmhouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/farmhouses/my");
                const found = data.find((f) => f._id === id);
                if (!cancelled) {
                    if (found) setFarmhouse(found);
                    else setLoadError("Farmhouse not found, or it is not yours.");
                }
            } catch (err) {
                if (!cancelled) setLoadError(getError(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [id]);

    async function handleSubmit(payload) {
        setError("");
        setSaving(true);
        try {
            const { data } = await api.put(`/farmhouses/${id}`, payload);
            navigate("/my-listings", { state: { notice: data.message } });
        } catch (err) {
            setError(getError(err));
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="container section narrow">
                <div className="skeleton" style={{ height: 320 }} />
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="container section center">
                <h2>{loadError}</h2>
                <Link to="/my-listings" className="btn btn-primary">Back to my listings</Link>
            </div>
        );
    }

    return (
        <div className="container section narrow">
            <Link to="/my-listings" className="back-link">← Back to my listings</Link>
            <h1>Edit farmhouse</h1>
            <p className="muted">
                If you change the details, the listing goes back to admin for approval.
            </p>
            <FarmhouseForm
                initial={farmhouse}
                onSubmit={handleSubmit}
                submitLabel="Save changes"
                loading={saving}
                error={error}
            />
        </div>
    );
}