import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const INDIA = [20.5937, 78.9629];
const round = (n) => Math.round(n * 1e6) / 1e6;

const pickIcon = L.divIcon({
    className: "pick-pin",
    html: "📍",
    iconSize: [32, 32],
    iconAnchor: [16, 30],
});

export default function LocationPicker({ value, onChange }) {
    const boxRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const changeRef = useRef(onChange);

    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        changeRef.current = onChange;
    });

    // map ek baar banta hai, click karne par pin lagta hai
    useEffect(() => {
        const map = L.map(boxRef.current, { scrollWheelZoom: false }).setView(INDIA, 5);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on("click", (e) => {
            changeRef.current({ latitude: round(e.latlng.lat), longitude: round(e.latlng.lng) });
        });

        mapRef.current = map;

        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(boxRef.current);

        return () => {
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // value badalne par pin ko sync karo
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const lat = value?.latitude;
        const lng = value?.longitude;

        if (lat == null || lng == null) {
            if (markerRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
            }
            return;
        }

        if (!markerRef.current) {
            const marker = L.marker([lat, lng], { icon: pickIcon, draggable: true }).addTo(map);

            marker.on("dragend", () => {
                const p = marker.getLatLng();
                changeRef.current({ latitude: round(p.lat), longitude: round(p.lng) });
            });

            markerRef.current = marker;
            map.setView([lat, lng], Math.max(map.getZoom(), 13));
        } else {
            markerRef.current.setLatLng([lat, lng]);
        }
    }, [value?.latitude, value?.longitude]);

    function place(lat, lng, zoom = 15) {
        onChange({ latitude: round(lat), longitude: round(lng) });
        mapRef.current?.flyTo([lat, lng], zoom, { duration: 0.8 });
    }

    // jagah ka naam search (OpenStreetMap ka free Nominatim)
    async function searchPlace() {
        const q = query.trim();

        if (q.length < 3) {
            setMessage("Type at least 3 letters to search.");
            return;
        }

        setSearching(true);
        setMessage("");
        setResults([]);

        try {
            const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`;
            const res = await fetch(url, { headers: { Accept: "application/json" } });

            if (!res.ok) throw new Error("search failed");

            const data = await res.json();

            if (!Array.isArray(data) || data.length === 0) {
                setMessage("No place found. Try a nearby town, or click on the map.");
            } else {
                setResults(
                    data.map((d) => ({
                        id: d.place_id,
                        name: d.display_name,
                        lat: Number(d.lat),
                        lng: Number(d.lon),
                    }))
                );
            }
        } catch {
            setMessage("Could not search places right now. You can click on the map instead.");
        } finally {
            setSearching(false);
        }
    }

    function onSearchKey(e) {
        // Enter dabane par poora form submit na ho
        if (e.key === "Enter") {
            e.preventDefault();
            searchPlace();
        }
    }

    function choose(r) {
        place(r.lat, r.lng, 15);
        setResults([]);
        setMessage("");
    }

    function useMyLocation() {
        if (!navigator.geolocation) {
            setMessage("Your browser does not support location.");
            return;
        }

        setMessage("Getting your location...");

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                place(pos.coords.latitude, pos.coords.longitude, 16);
                setMessage("");
            },
            () => setMessage("Could not get your location. Allow location access, or click on the map."),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    const hasPin = value?.latitude != null && value?.longitude != null;

    return (
        <div className="loc-picker">
            <div className="lp-search">
                <input
                    className="form-input"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onSearchKey}
                    placeholder="Search a place, e.g. Lonavala"
                    aria-label="Search a place"
                />
                <button type="button" className="btn btn-outline btn-sm" onClick={searchPlace} disabled={searching}>
                    {searching ? "Searching..." : "Find"}
                </button>
            </div>

            {results.length > 0 && (
                <ul className="lp-results">
                    {results.map((r) => (
                        <li key={r.id}>
                            <button type="button" onClick={() => choose(r)}>{r.name}</button>
                        </li>
                    ))}
                </ul>
            )}

            {message && <p className="hint">{message}</p>}

            <div className="lp-map">
                <div ref={boxRef} className="map-box" style={{ height: "100%" }} />
            </div>

            <div className="lp-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}>
                    📍 Use my location
                </button>
                {hasPin && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => onChange(null)}>
                        Remove pin
                    </button>
                )}
                <span className="muted">
                    {hasPin
                        ? `Pin set: ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}. Drag it to fine tune.`
                        : "No pin yet. Click on the map to place one."}
                </span>
            </div>
        </div>
    );
}