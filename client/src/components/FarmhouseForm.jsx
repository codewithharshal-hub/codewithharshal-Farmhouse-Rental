import { useEffect, useRef, useState } from "react";
import { getError } from "../services/api";
import { uploadImages } from "../services/upload";
import LocationPicker from "./LocationPicker";

const MAX_PHOTOS = 5;
const MAX_MB = 5;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const emptyForm = {
    title: "",
    location: "",
    description: "",
    pricePerNight: "",
    maxGuests: "",
    bedrooms: "",
    amenities: "",
    upiId: "",
    advancePercentage: 30,
    paymentInstructions: "",
    arrivalNotes: "",
};

function fromFarmhouse(f) {
    return {
        title: f.title || "",
        location: f.location || "",
        description: f.description || "",
        pricePerNight: f.pricePerNight ?? "",
        maxGuests: f.maxGuests ?? "",
        bedrooms: f.bedrooms ?? "",
        amenities: (f.amenities || []).join(", "),
        upiId: f.upiId || "",
        advancePercentage: f.advancePercentage ?? 30,
        paymentInstructions: f.paymentInstructions || "",
        arrivalNotes: f.arrivalNotes || "",
    };
}

export default function FarmhouseForm({ initial, onSubmit, submitLabel = "Submit", loading, error }) {
    const [form, setForm] = useState(() => (initial ? fromFarmhouse(initial) : emptyForm));
    const [existing, setExisting] = useState(() => initial?.images || []);
    const [files, setFiles] = useState([]); // { id, file, url }
    const [coords, setCoords] = useState(() =>
        initial?.latitude != null && initial?.longitude != null
            ? { latitude: initial.latitude, longitude: initial.longitude }
            : null
    );
    const [uploading, setUploading] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [localError, setLocalError] = useState("");

    const inputRef = useRef(null);
    const filesRef = useRef([]);

    useEffect(() => {
        filesRef.current = files;
    }, [files]);

    // page chhodte waqt previews ki memory free karo
    useEffect(() => {
        return () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
    }, []);

    const busy = loading || uploading;
    const total = existing.length + files.length;

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function addFiles(fileList) {
        setLocalError("");

        const room = MAX_PHOTOS - existing.length - files.length;
        const accepted = [];
        let problem = "";

        for (const file of Array.from(fileList)) {
            if (!TYPES.includes(file.type)) {
                problem = "Only JPG, PNG or WEBP photos are allowed.";
                continue;
            }
            if (file.size > MAX_MB * 1024 * 1024) {
                problem = `Each photo must be ${MAX_MB} MB or smaller.`;
                continue;
            }
            if (accepted.length >= room) {
                problem = `You can add up to ${MAX_PHOTOS} photos.`;
                break;
            }
            accepted.push({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) });
        }

        if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
        if (problem) setLocalError(problem);
        if (inputRef.current) inputRef.current.value = "";
    }

    function removeNew(id) {
        setFiles((prev) => {
            const target = prev.find((f) => f.id === id);
            if (target) URL.revokeObjectURL(target.url);
            return prev.filter((f) => f.id !== id);
        });
    }

    function removeExisting(src) {
        setExisting((prev) => prev.filter((s) => s !== src));
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragging(false);
        if (!busy) addFiles(e.dataTransfer.files);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLocalError("");

        const price = Number(form.pricePerNight);
        const guests = Number(form.maxGuests);
        const rooms = Number(form.bedrooms);

        if (!form.title.trim() || !form.location.trim() || !form.description.trim()) {
            setLocalError("Title, location and description are required.");
            return;
        }
        if (!(price >= 1)) {
            setLocalError("Enter a valid price per night.");
            return;
        }
        if (!Number.isInteger(guests) || guests < 1 || !Number.isInteger(rooms) || rooms < 1) {
            setLocalError("Guests and bedrooms must be whole numbers (1 or more).");
            return;
        }
        if (total < 1) {
            setLocalError("Please add at least one photo.");
            return;
        }

        let images = existing;

        if (files.length) {
            setUploading(true);
            try {
                const { uploadImages: upload } = { uploadImages };
                const urls = await upload(files.map((f) => f.file));
                images = [...existing, ...urls];

                // upload ho gayi, retry pe dobara upload na ho
                files.forEach((f) => URL.revokeObjectURL(f.url));
                setExisting(images);
                setFiles([]);
            } catch (err) {
                setLocalError(getError(err));
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        onSubmit({
            title: form.title.trim(),
            location: form.location.trim(),
            description: form.description.trim(),
            pricePerNight: price,
            maxGuests: guests,
            bedrooms: rooms,
            amenities: form.amenities.split(",").map((s) => s.trim()).filter(Boolean),
            images,
            upiId: form.upiId.trim(),
            advancePercentage: Number(form.advancePercentage) || 30,
            paymentInstructions: form.paymentInstructions.trim(),
            arrivalNotes: form.arrivalNotes.trim(),
            latitude: coords ? coords.latitude : null,
            longitude: coords ? coords.longitude : null,
        });
    }

    const shownError = localError || error;

    return (
        <form className="form-card card" onSubmit={handleSubmit} noValidate>
            {shownError && <div className="alert alert-error" role="alert">{shownError}</div>}

            <label htmlFor="title">Title</label>
            <input id="title" name="title" className="form-input" value={form.title}
                onChange={handleChange} placeholder="Green Valley Farmhouse" />

            <label htmlFor="location">Location (shown to guests)</label>
            <input id="location" name="location" className="form-input" value={form.location}
                onChange={handleChange} placeholder="Village, city" />

            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" className="form-input" rows={5}
                value={form.description} onChange={handleChange}
                placeholder="Tell guests what makes your farmhouse special" />

            <div className="form-row">
                <div>
                    <label htmlFor="pricePerNight">Price per night (₹)</label>
                    <input id="pricePerNight" name="pricePerNight" type="number" min="1" className="form-input"
                        value={form.pricePerNight} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="maxGuests">Max guests</label>
                    <input id="maxGuests" name="maxGuests" type="number" min="1" className="form-input"
                        value={form.maxGuests} onChange={handleChange} />
                </div>
                <div>
                    <label htmlFor="bedrooms">Bedrooms</label>
                    <input id="bedrooms" name="bedrooms" type="number" min="1" className="form-input"
                        value={form.bedrooms} onChange={handleChange} />
                </div>
            </div>

            <label htmlFor="amenities">Amenities (comma separated)</label>
            <input id="amenities" name="amenities" className="form-input" value={form.amenities}
                onChange={handleChange} placeholder="WiFi, Swimming pool, Parking, Garden" />

            <div className="form-row">
                <div>
                    <label htmlFor="upiId">Your UPI ID for Advance Payments (optional)</label>
                    <input id="upiId" name="upiId" className="form-input" value={form.upiId}
                        onChange={handleChange} placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm" />
                    <p className="hint">Guests will scan the advance QR generated for this UPI ID upon booking confirmation.</p>
                </div>
                <div>
                    <label htmlFor="advancePercentage">Advance Required (%)</label>
                    <input id="advancePercentage" name="advancePercentage" type="number" min="10" max="100" className="form-input"
                        value={form.advancePercentage} onChange={handleChange} placeholder="30" />
                    <p className="hint">Default is 30% advance to secure the date.</p>
                </div>
            </div>

            <label htmlFor="paymentInstructions">How guests should pay (optional)</label>
            <textarea id="paymentInstructions" name="paymentInstructions" className="form-input" rows={3}
                maxLength={300} value={form.paymentInstructions} onChange={handleChange}
                placeholder="e.g. 30% advance on UPI yourname@bank, the rest on arrival" />
            <p className="hint">
                Shown only to guests whose booking you have confirmed. Never enter passwords, PINs or card numbers.
            </p>

            <label htmlFor="arrivalNotes">Arrival notes (optional)</label>
            <textarea id="arrivalNotes" name="arrivalNotes" className="form-input" rows={3}
                maxLength={500} value={form.arrivalNotes} onChange={handleChange}
                placeholder="e.g. Check-in 2 PM, check-out 11 AM. Call when you reach the main gate." />
            <p className="hint">Also shown only to confirmed guests.</p>

            <label>Map location (optional)</label>
            <p className="hint" style={{ margin: "0 0 4px" }}>
                Pin your farmhouse so guests can find it on the map. The exact pin is visible to everyone.
            </p>
            <LocationPicker value={coords} onChange={setCoords} />

            <label>Photos ({total}/{MAX_PHOTOS})</label>

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple
                className="file-hidden" tabIndex={-1} aria-hidden="true"
                onChange={(e) => addFiles(e.target.files)} />

            <button type="button"
                className={`dropzone ${dragging ? "drag" : ""}`}
                disabled={busy || total >= MAX_PHOTOS}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}>
                <span className="dz-icon">📷</span>
                <strong>{total >= MAX_PHOTOS ? "Maximum photos added" : "Choose photos from your gallery"}</strong>
                <span className="muted">
                    {total >= MAX_PHOTOS
                        ? "Remove a photo to add another"
                        : "or drag and drop here · JPG, PNG, WEBP · up to 5 MB each"}
                </span>
            </button>

            {total > 0 && (
                <>
                    <div className="photo-grid">
                        {existing.map((src, i) => (
                            <div className="photo-item" key={src}>
                                <img src={src} alt={`Photo ${i + 1}`} />
                                {i === 0 && <span className="cover-tag">Cover</span>}
                                <button type="button" className="photo-remove" disabled={busy}
                                    onClick={() => removeExisting(src)} aria-label="Remove photo">✕</button>
                            </div>
                        ))}

                        {files.map((f, i) => (
                            <div className="photo-item" key={f.id}>
                                <img src={f.url} alt={`New photo ${i + 1}`} />
                                {existing.length === 0 && i === 0 && <span className="cover-tag">Cover</span>}
                                <button type="button" className="photo-remove" disabled={busy}
                                    onClick={() => removeNew(f.id)} aria-label="Remove photo">✕</button>
                            </div>
                        ))}
                    </div>
                    <p className="hint">The first photo is shown as the cover.</p>
                </>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
                {uploading ? "Uploading photos..." : loading ? "Please wait..." : submitLabel}
            </button>
        </form>
    );
}