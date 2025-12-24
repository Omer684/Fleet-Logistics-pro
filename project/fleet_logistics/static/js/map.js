const GEOLOCATION_CACHE_KEY = 'geolocation_cache';
let map;
let markerLayer;
let isMapInitialized = false;

export function initializeMap() {
    const el = document.getElementById('fleet-map');
    // If the map container doesn't exist or map is already initialized, skip.
    // NOTE: We check if L is defined in the global scope (loaded via script tag).
    if (!el || typeof L === 'undefined' || isMapInitialized) return;

    if (map) map.remove();

    map = L.map('fleet-map').setView([41.8781, -87.6298], 4);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    L.circleMarker([41.8781, -87.6298], {
        radius: 8, fillColor: '#3b82f6', color: "#fff", weight: 2, fillOpacity: 1
    }).addTo(markerLayer).bindPopup("<b>Main Logistics Hub (Chicago)</b>");

    isMapInitialized = true;
    return map;
}

export async function geocodeAddress(address) {
    if (!address) return null;

    const cache = JSON.parse(localStorage.getItem(GEOLOCATION_CACHE_KEY) || '{}');
    const normalizedAddress = address.toLowerCase().trim();

    if (cache[normalizedAddress]) {
        return cache[normalizedAddress];
    }

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
        const data = await res.json();

        if (data && data[0]) {
            const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            cache[normalizedAddress] = coords;
            localStorage.setItem(GEOLOCATION_CACHE_KEY, JSON.stringify(cache));
            return coords;
        }
    } catch (error) {
        console.error("External Geocoding service failed:", error);
    }
    return null;
}

export async function updateMapMarkers(shipments) {
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();
    const bounds = [[41.8781, -87.6298]]; // Hub

    for (const shipment of shipments) {
        if (['Delivered', 'Returned'].includes(shipment.status)) continue;

        const coords = await geocodeAddress(shipment.destination);

        if (coords) {
            const color = shipment.priority === 'High' ? 'red' : (shipment.status === 'Processing' ? 'blue' : 'gold');

            L.circleMarker(coords, {
                radius: 8,
                fillColor: color,
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(markerLayer).bindPopup(`<b>${shipment.trackingId}</b><br>${shipment.status}<br>Destination: ${shipment.destination}`);

            bounds.push(coords);
        }
    }

    if (bounds.length > 1) {
        const allBounds = L.latLngBounds(bounds);
        map.fitBounds(allBounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
        map.setView(bounds[0], 5);
    }
}

export function invalidateMapSize() {
    if (map) map.invalidateSize(true);
}
