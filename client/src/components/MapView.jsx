import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatPrice } from "../utils/format";

const INDIA = [20.5937, 78.9629];

// price wala pin (sirf numbers hain, isliye HTML mein dalna safe hai)
function pinIcon(price, active) {
    return L.divIcon({
        className: "map-pin-wrap",
        html: `<span class="map-pin ${active ? "active" : ""}">${formatPrice(price)}</span>`,
        iconSize: [78, 30],
        iconAnchor: [39, 15],
    });
}

// popup ko DOM se banate hain (text safe rehta hai, koi HTML inject nahi ho sakta)
function buildPopup(fh, onOpen) {
    const wrap = document.createElement("div");
    wrap.className = "map-popup";

    if (fh.images?.[0]) {
        const img = document.createElement("img");
        img.src = fh.images[0];
        img.alt = "";
        wrap.appendChild(img);
    }

    const title = document.createElement("strong");
    title.textContent = fh.title;
    wrap.appendChild(title);

    const loc = document.createElement("span");
    loc.className = "loc";
    loc.textContent = `📍 ${fh.location}`;
    wrap.appendChild(loc);

    const meta = document.createElement("span");
    meta.className = "loc";
    const rating = fh.ratingCount > 0 ? `★ ${(fh.ratingAverage || 0).toFixed(1)} (${fh.ratingCount}) · ` : "";
    meta.textContent = `${rating}👥 ${fh.maxGuests} · 🛏 ${fh.bedrooms}`;
    wrap.appendChild(meta);

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = `${formatPrice(fh.pricePerNight)} / night`;
    wrap.appendChild(price);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "View details";
    button.addEventListener("click", () => onOpen(fh._id));
    wrap.appendChild(button);

    return wrap;
}

export default function MapView({
    farmhouses,
    activeId = "",
    focus = null,
    onSelect,
    onOpen,
    single = false,
    height = "100%",
}) {
    const boxRef = useRef(null);
    const mapRef = useRef(null);
    const layerRef = useRef(null);
    const markersRef = useRef(new Map());
    const prevActive = useRef("");
    const callbacks = useRef({ onSelect, onOpen });

    // hamesha latest functions use hon
    useEffect(() => {
        callbacks.current = { onSelect, onOpen };
    });

    // map ek baar banta hai
    useEffect(() => {
        const map = L.map(boxRef.current, {
            scrollWheelZoom: !single,
            dragging: !(single && L.Browser.mobile),
        }).setView(INDIA, 5);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        }).addTo(map);

        layerRef.current = L.layerGroup().addTo(map);
        mapRef.current = map;

        // container ka size badle (jaise tab badalne par) to map theek se dikhe
        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(boxRef.current);

        const markers = markersRef.current;

        return () => {
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            layerRef.current = null;
            markers.clear();
        };
    }, [single]);

    // farmhouses badalne par pins dobara lagte hain
    useEffect(() => {
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) return;

        layer.clearLayers();
        markersRef.current.clear();

        const points = [];

        farmhouses.forEach((fh) => {
            if (fh.latitude == null || fh.longitude == null) return;

            const marker = L.marker([fh.latitude, fh.longitude], {
                icon: pinIcon(fh.pricePerNight, false),
                riseOnHover: true,
                price: fh.pricePerNight,
            });

            if (!single) {
                marker.bindPopup(buildPopup(fh, (id) => callbacks.current.onOpen?.(id)), {
                    maxWidth: 240,
                    minWidth: 200,
                });
                marker.on("click", () => callbacks.current.onSelect?.(fh._id));
            }

            marker.addTo(layer);
            markersRef.current.set(fh._id, marker);
            points.push([fh.latitude, fh.longitude]);
        });

        if (points.length === 1) {
            map.setView(points[0], single ? 14 : 12);
        } else if (points.length > 1) {
            map.fitBounds(points, { padding: [50, 50], maxZoom: 13 });
        }
    }, [farmhouses, single]);

    // jis farmhouse pe mouse ya click hai uska pin highlight
    useEffect(() => {
        const paint = (id, active) => {
            const marker = markersRef.current.get(id);
            if (!marker) return;
            marker.setIcon(pinIcon(marker.options.price, active));
            marker.setZIndexOffset(active ? 1000 : 0);
        };

        if (prevActive.current && prevActive.current !== activeId) {
            paint(prevActive.current, false);
        }
        if (activeId) paint(activeId, true);

        prevActive.current = activeId;
    }, [activeId, farmhouses]);

    // list se click karne par map wahan ud ke jaye aur popup khule
    useEffect(() => {
        if (!focus) return;

        const marker = markersRef.current.get(focus.id);
        const map = mapRef.current;
        if (!marker || !map) return;

        map.invalidateSize();
        map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 13), { duration: 0.6 });
        marker.openPopup();
    }, [focus]);

    return <div ref={boxRef} className="map-box" style={{ height }} />;
}