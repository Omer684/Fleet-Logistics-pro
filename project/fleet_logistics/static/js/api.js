export const API_ENDPOINT = 'http://127.0.0.1:5000/shipments';

export async function fetchShipments() {
    try {
        const res = await fetch(API_ENDPOINT);
        if (!res.ok) throw new Error("API Error");
        return await res.json();
    } catch (err) {
        console.error("Fetch Error:", err);
        throw err;
    }
}

export async function addShipment(data) {
    const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errorDetail = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorDetail.message);
    }
    return await res.json();
}

export async function updateShipmentStatus(id, status) {
    const res = await fetch(`${API_ENDPOINT}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status }),
    });
    if (!res.ok) {
        const errorDetail = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorDetail.message);
    }
    return await res.json();
}

export async function clearAllShipments() {
    const res = await fetch(`${API_ENDPOINT}/clear`, { method: 'DELETE' });
    if (!res.ok) {
        const errorDetail = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorDetail.message);
    }
    return await res.json();
}
