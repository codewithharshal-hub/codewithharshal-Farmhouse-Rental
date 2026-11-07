import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import FarmhouseForm from "../components/FarmhouseForm";

export default function AddFarmhouse() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);
    const [formKey, setFormKey] = useState(0);

    async function handleSubmit(payload) {
        setError("");
        setLoading(true);
        try {
            await api.post("/farmhouses", payload);
            setDone(true);
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    function listAnother() {
        setDone(false);
        setFormKey((k) => k + 1);
    }

    if (done) {
        return (
            <div className="container section center">
                <div className="empty-icon">✅</div>
                <h2>Farmhouse submitted!</h2>
                <p className="muted">Our admin will review it. Once approved, it will appear for guests.</p>
                <div className="hero-actions">
                    <button type="button" className="btn btn-primary" onClick={listAnother}>List another</button>
                    <Link to="/farmhouses" className="btn btn-outline">Browse farmhouses</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container section narrow">
            <h1>List your farmhouse</h1>
            <p className="muted">Fill in the details. Your listing goes live after admin approval.</p>
            <FarmhouseForm
                key={formKey}
                onSubmit={handleSubmit}
                submitLabel="Submit for approval"
                loading={loading}
                error={error}
            />
        </div>
    );
}