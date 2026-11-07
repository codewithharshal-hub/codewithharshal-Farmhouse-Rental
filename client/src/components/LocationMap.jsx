import { useMemo } from "react";
import MapView from "./MapView";

// details page ka chhota map aur Google Maps ke links
export default function LocationMap({ farmhouse }) {
    const { latitude, longitude } = farmhouse;
    const items = useMemo(() => [farmhouse], [farmhouse]);

    if (latitude == null || longitude == null) return null;

    const spot = `${latitude},${longitude}`;

    return (
        <section className="loc-section">
            <h3>Location</h3>
            <p className="muted" style={{ margin: 0 }}>📍 {farmhouse.location}</p>

            <div className="loc-map">
                <MapView farmhouses={items} single height="100%" />
            </div>

            <div className="loc-links">
                <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"
                    href={`https://www.google.com/maps/search/?api=1&query=${spot}`}>
                    Open in Google Maps
                </a>
                <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${spot}`}>
                    Get directions
                </a>
            </div>
        </section>
    );
}