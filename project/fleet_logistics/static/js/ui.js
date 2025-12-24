import { CURRENT_USER } from './auth.js';
import { initializeMap, updateMapMarkers, invalidateMapSize } from './map.js';
import { fetchShipments, updateShipmentStatus, clearAllShipments } from './api.js';

// --- UI HELPERS ---

export function showFlash(msg, type) {
    const color = type === 'success' ? 'bg-green-500' : (type === 'error' ? 'bg-red-500' : 'bg-blue-500');
    const el = document.createElement('div');
    el.className = `fixed top-6 right-6 px-6 py-3 rounded-lg shadow-2xl text-white font-bold text-sm ${color} fade-in z-[60]`;
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

export function showConfirmation(title, text, input = false) {
    return new Promise(resolve => {
        const modal = document.getElementById('confirmation-modal');
        const inp = document.getElementById('confirm-input');
        const err = document.getElementById('confirm-error');

        document.getElementById('confirm-title').innerText = title;
        document.getElementById('confirm-message').innerText = text;
        inp.value = '';
        err.classList.add('hidden');
        inp.classList.toggle('hidden', !input);

        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const cleanup = () => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.getElementById('execute-confirm-btn').onclick = null;
            document.getElementById('cancel-confirm-btn').onclick = null;
        };

        document.getElementById('execute-confirm-btn').onclick = () => {
            const val = input ? inp.value.trim() : true;
            if (input && !val) {
                err.classList.remove('hidden');
                return;
            }
            cleanup();
            resolve(val);
        };
        document.getElementById('cancel-confirm-btn').onclick = () => {
            cleanup();
            resolve(false);
        };
    });
}

// --- RENDERERS ---

export function renderNav() {
    return `
        <header class="py-4 px-8 nav-header">
            <div class="max-w-7xl mx-auto flex justify-between items-center">
                <div class="text-2xl font-extrabold text-white flex items-center gap-3">
                    <i class="ph ph-truck text-blue-500"></i> FleetLogistics <span class="text-sm font-light text-gray-500">Pro</span>
                </div>
                <nav class="flex items-center gap-6 text-sm">
                    <div id="api-status-display" class="text-xs font-semibold">
                        <span class="text-gray-400">● Connecting...</span>
                    </div>
                    <span class="text-white font-medium">${CURRENT_USER.username} (${CURRENT_USER.role})</span>
                    <button id="logout-btn" class="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white font-semibold transition">
                        <i class="ph ph-sign-out text-lg"></i>
                    </button>
                </nav>
            </div>
        </header>
    `;
}

export function renderLoginView() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="flex-grow flex items-center justify-center p-4 fade-in">
            <div class="glass-panel w-full max-w-5xl rounded-3xl overflow-hidden flex shadow-2xl">
                <div class="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div class="mb-10">
                        <h1 class="text-4xl font-bold text-main-white mb-2">Welcome Back</h1>
                        <p class="text-gray-500">Enter your credentials to access the portal.</p>
                    </div>
                    <form id="loginForm" class="space-y-6">
                        <div>
                            <label class="text-sm font-medium text-gray-500 ml-1">Email Address</label>
                            <div class="relative mt-1">
                                <i class="ph ph-envelope absolute left-3 top-3.5 text-gray-500 text-lg"></i>
                                <input type="email" name="email" placeholder="admin@fleetlogistics.com" class="glass-input w-full rounded-xl py-3 pl-10 pr-4" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-sm font-medium text-gray-500 ml-1">Password</label>
                            <div class="relative mt-1">
                                <i class="ph ph-lock absolute left-3 top-3.5 text-gray-500 text-lg"></i>
                                <input type="password" name="password" placeholder="•••••••" class="glass-input w-full rounded-xl py-3 pl-10 pr-4" required>
                            </div>
                        </div>
                        <button type="submit" class="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 transition-all transform hover:-translate-y-0.5">
                            Sign In
                        </button>
                    </form>
                    <div class="mt-6 text-center">
                        <p class="text-sm text-gray-500">Don't have an account? <button id="show-signup-btn" class="text-blue-600 font-bold hover:underline">Sign Up</button></p>
                    </div>
                    <div class="mt-8 p-4 bg-slate-100 rounded-lg text-xs text-gray-500 border border-slate-200">
                        <p><strong>Demo Logins:</strong></p>
                        <p>Admin: admin@fleetlogistics.com / admin123</p>
                        <p>Customer: customer@example.com / customer123</p>
                    </div>
                </div>
                <div class="hidden md:block w-1/2 relative bg-slate-100">
                    <img src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1000&auto=format&fit=crop" class="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply">
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-100 via-transparent to-transparent"></div>
                    <div class="absolute bottom-12 left-12 right-12">
                        <h2 class="text-2xl font-bold text-main-white mb-2">Global Tracking</h2>
                        <p class="text-gray-600 text-sm">Real-time visibility into your supply chain operations with advanced telemetry.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

export function renderSignupView() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="flex-grow flex items-center justify-center p-4 fade-in">
            <div class="glass-panel w-full max-w-md p-8 rounded-3xl shadow-2xl border-t-4 border-green-500">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-main-white">Create Account</h1>
                    <p class="text-gray-500 text-sm mt-2">Join the logistics team (Staff Role)</p>
                </div>

                <form id="signupForm" class="space-y-5">
                    <input type="email" name="email" placeholder="Email Address" class="glass-input w-full rounded-xl p-3" required>
                    <input type="password" name="password" placeholder="Password (min 6 chars)" class="glass-input w-full rounded-xl p-3" required>
                    <input type="password" name="password_confirm" placeholder="Confirm Password" class="glass-input w-full rounded-xl p-3" required>
                    <button type="submit" class="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-600/20 transition-all">Register</button>
                </form>

                <p class="text-center text-sm text-gray-500 mt-6">
                    Already have an account? <button id="show-login-btn" class="text-blue-600 font-semibold hover:underline">Sign In</button>
                </p>
            </div>
        </div>
    `;
}

export function renderDashboardView() {
    const app = document.getElementById('app');
    app.innerHTML = renderNav();

    app.insertAdjacentHTML('beforeend', `
        <main class="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 pb-12 fade-in">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="glass-panel p-6 rounded-2xl flex items-center justify-between group hover:bg-slate-100 transition">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Total Shipments</p>
                        <p id="total-shipment-count" class="text-4xl font-bold text-main-white mt-1">...</p>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center text-2xl group-hover:scale-110 transition">📦</div>
                </div>
                <div class="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-orange-500 hover:bg-slate-100 transition">
                    <div>
                        <p class="text-sm font-medium text-gray-500">High Priority</p>
                        <p id="high-priority-count" class="text-4xl font-bold text-orange-500 mt-1">...</p>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-orange-100/50 flex items-center justify-center text-2xl text-orange-500">🔥</div>
                </div>
                <div class="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-green-500 hover:bg-slate-100 transition">
                    <div>
                        <p class="text-sm font-medium text-gray-500">Delivered</p>
                        <p id="delivered-count" class="text-4xl font-bold text-green-500 mt-1">...</p>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-green-100/50 flex items-center justify-center text-2xl text-green-500">✅</div>
                </div>
            </div>

            <div class="flex justify-start mb-4">
                <button id="toggle-map-btn" class="px-4 py-2 bg-slate-600 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow transition flex items-center gap-2">
                     <i class="ph ph-map-pin-simple-fill"></i> Show Map
                </button>
            </div>

            <div id="map-wrapper" class="map-container-wrapper mb-8">
                <section>
                    <div class="glass-panel p-1 rounded-2xl shadow-xl">
                        <div id="fleet-map"></div>
                    </div>
                </section>
            </div>

            <section class="glass-panel rounded-2xl overflow-hidden">
                <div class="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100/40">
                    <h2 class="text-xl font-bold text-main-white flex items-center gap-2">
                        <i class="ph ph-list-dashes"></i> Active Manifest
                    </h2>
                    <div class="flex flex-wrap gap-3">
                        <button id="process-next-delivery-btn" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow transition flex items-center gap-2">
                            <i class="ph ph-check-circle"></i> Deliver Next
                        </button>
                        <button id="add-new-return-btn" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-lg shadow transition flex items-center gap-2">
                            <i class="ph ph-arrow-u-up-left"></i> Return
                        </button>
                        <button id="add-parcel-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow transition flex items-center gap-2">
                            <i class="ph ph-plus"></i> Add Parcel
                        </button>
                        ${CURRENT_USER.role === 'Admin' ? `
                        <button id="clear-data-btn" class="px-4 py-2 bg-gray-500 hover:bg-gray-400 text-white text-sm font-semibold rounded-lg shadow transition flex items-center gap-2">
                            <i class="ph ph-trash"></i> Clear All Data
                        </button>` : ''}
                    </div>
                </div>

                <div class="grid grid-cols-6 bg-slate-100 text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 border-b border-slate-200">
                    <div class="col-span-2">Tracking / Route</div>
                    <div>Priority</div>
                    <div>Status</div>
                    <div>Timestamp</div>
                    <div class="text-right">Manage</div>
                </div>

                <div id="shipment-list-container" class="divide-y divide-slate-200 max-h-[500px] overflow-y-auto bg-white/60">
                    <div class="p-8 text-center text-gray-500">
                        <div class="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full text-blue-500"></div>
                        <p class="mt-2 text-sm">Syncing with satellite...</p>
                    </div>
                </div>
            </section>
        </main>
    `);
}

export function renderCustomerPortal() {
    const app = document.getElementById('app');
    app.innerHTML = renderNav();
    app.insertAdjacentHTML('beforeend', `
        <main class="flex-grow max-w-5xl mx-auto w-full px-4 md:px-8 pb-12 fade-in">
            <div class="text-center mb-10">
                <h1 class="text-3xl font-bold text-main-white mb-2">Order Tracking</h1>
                <p class="text-gray-500">View real-time updates for your packages.</p>
            </div>
            <section class="glass-panel rounded-2xl overflow-hidden shadow-2xl">
                <div class="p-6 border-b border-slate-200 bg-slate-100/40">
                    <h3 class="text-lg font-bold text-main-white">Your Shipments</h3>
                </div>
                <div class="grid grid-cols-4 bg-slate-100 text-xs font-semibold text-gray-500 uppercase tracking-wider p-4 border-b border-slate-200">
                    <div class="col-span-2">Package Details</div>
                    <div>Priority</div>
                    <div class="text-right">Current Status</div>
                </div>
                <div id="shipment-list-container" class="divide-y divide-slate-200 bg-white/60">
                    <div class="p-8 text-center text-gray-500 italic">Looking up orders...</div>
                </div>
            </section>
        </main>
    `);
}
// Shipments that 'customer@example.com' is allowed to see.
const CUSTOMER_SHIPMENT_IDS = ['TRK001', 'TRK002', 'TRK003'];

export async function refreshDashboard() {
    const listContainer = document.getElementById('shipment-list-container');
    const statusDisplay = document.getElementById('api-status-display');
    const isDashboard = !!document.getElementById('total-shipment-count');
    const isCustomer = CURRENT_USER?.role === 'Customer';

    if (statusDisplay) statusDisplay.innerHTML = '<span class="text-gray-400">● Connecting...</span>';

    try {
        const allShipments = await fetchShipments();
        if (statusDisplay) statusDisplay.innerHTML = '<span class="text-green-500">● API Online</span>';

        let displayData = isCustomer
            ? allShipments.filter(s => CUSTOMER_SHIPMENT_IDS.includes(s.trackingId))
            : allShipments;

        displayData.sort((a, b) => {
            const statusOrder = { 'Scheduled': 1, 'Processing': 2, 'Returned': 3, 'Delivered': 4 };
            if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        if (isDashboard) {
            document.getElementById('total-shipment-count').textContent = allShipments.length;
            document.getElementById('high-priority-count').textContent = allShipments.filter(s => s.priority === 'High' && s.status !== 'Delivered').length;
            document.getElementById('delivered-count').textContent = allShipments.filter(s => s.status === 'Delivered').length;

            // Map updates only for dashboard view
            await updateMapMarkers(allShipments);
        }

        if (listContainer) {
            listContainer.innerHTML = '';
            if (displayData.length === 0) {
                listContainer.innerHTML = `<div class="p-8 text-center text-gray-500">No shipments found.</div>`;
                return;
            }

            displayData.forEach(item => {
                const isDone = ['Delivered', 'Returned'].includes(item.status);
                const date = new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const row = document.createElement('div');

                if (isCustomer) {
                    row.className = 'grid grid-cols-4 p-4 text-sm hover:bg-slate-100 transition items-center';
                    row.innerHTML = `
                        <div class="col-span-2">
                            <div class="font-bold text-main-white">${item.trackingId}</div>
                            <div class="text-xs text-gray-500">${item.destination}</div>
                        </div>
                        <div><span class="text-orange-600 font-medium">${item.priority}</span></div>
                        <div class="text-right"><span class="status-badge status-${item.status}">${item.status}</span></div>
                    `;
                } else {
                    row.className = 'grid grid-cols-6 p-4 text-sm hover:bg-slate-100 transition items-center group';
                    row.innerHTML = `
                        <div class="col-span-2">
                            <div class="font-bold text-main-white flex items-center gap-2">
                                <i class="ph ph-package text-gray-500"></i> ${item.trackingId}
                            </div>
                            <div class="text-xs text-gray-500 pl-6">${item.destination}</div>
                        </div>
                        <div><span class="text-${item.priority === 'High' ? 'orange-600' : 'gray-500'} font-medium">${item.priority}</span></div>
                        <div><span class="status-badge status-${item.status}">${item.status}</span></div>
                        <div class="text-gray-500 text-xs font-mono">${date}</div>
                        <div class="text-right relative">
                            ${!isDone ? `
                                <button class="action-toggle-btn px-2 py-1 rounded hover:bg-slate-200 text-gray-600">
                                    <i class="ph ph-dots-three-vertical text-lg"></i>
                                </button>
                                <div class="action-dropdown glass-panel rounded-lg shadow-xl hidden overflow-hidden text-left">
                                    ${item.status === 'Scheduled' ? `<button data-id="${item.id}" data-action="Processing" class="status-action-btn block w-full text-left px-4 py-3 hover:bg-blue-100 text-blue-600 text-xs font-semibold">Start Transit</button>` : ''}
                                    <button data-id="${item.id}" data-action="Delivered" class="status-action-btn block w-full text-left px-4 py-3 hover:bg-green-100 text-green-600 text-xs font-semibold">Mark Delivered</button>
                                    <button data-id="${item.id}" data-action="Returned" class="status-action-btn block w-full text-left px-4 py-3 hover:bg-red-100 text-red-600 text-xs font-semibold">Mark Returned</button>
                                </div>
                            ` : '<span class="text-gray-500 italic text-xs">Completed</span>'}
                        </div>
                    `;
                }
                listContainer.appendChild(row);
            });

            if (!isCustomer) attachDropdownListeners();
        }

    } catch (err) {
        if (statusDisplay) statusDisplay.innerHTML = '<span class="text-red-500">● API Offline</span>';
        if (listContainer) listContainer.innerHTML = `<div class="p-8 text-center text-red-500 text-sm">Cannot connect to server.</div>`;
        if (isDashboard) {
            document.getElementById('total-shipment-count').textContent = 'ERR';
            document.getElementById('high-priority-count').textContent = 'ERR';
            document.getElementById('delivered-count').textContent = 'ERR';
        }
    }
}

function attachDropdownListeners() {
    document.querySelectorAll('.action-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = btn.nextElementSibling;
            document.querySelectorAll('.action-dropdown').forEach(el => { if (el !== menu) el.classList.add('hidden'); });
            menu.classList.toggle('hidden');
        });
    });
    document.querySelectorAll('.status-action-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const status = e.target.getAttribute('data-action');
            if (await showConfirmation("Update Status", `Change status to ${status}?`)) {
                try {
                    await updateShipmentStatus(id, status);
                    showFlash(`Updated to ${status}`, 'success');
                    refreshDashboard();
                } catch (err) {
                    showFlash(err.message, 'error');
                }
            }
        });
    });
    window.onclick = () => document.querySelectorAll('.action-dropdown').forEach(el => el.classList.add('hidden'));
}
