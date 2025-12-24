import { CURRENT_USER, loadSession, clearSession, getMockUser, saveMockUser, saveSession } from './auth.js';
import { renderLoginView, renderSignupView, renderDashboardView, renderCustomerPortal, refreshDashboard, showFlash, showConfirmation } from './ui.js';
import { initializeMap, geocodeAddress, invalidateMapSize } from './map.js';
import { addShipment, clearAllShipments, fetchShipments, updateShipmentStatus } from './api.js';

async function init() {
    loadSession();
    renderApp();
}

function renderApp() {
    if (CURRENT_USER?.role === 'Customer') {
        renderCustomerPortal();
        refreshDashboard();
    } else if (CURRENT_USER) {
        renderDashboardView();
        initializeMap();
        setTimeout(refreshDashboard, 0); // Allow map to render
    } else {
        renderLoginView();
    }
    attachGlobalListeners();
}

function attachGlobalListeners() {
    // We attach listeners to the body/document and delegate, or re-attach after render. 
    // Since re-rendering wipes DOM, we will use a mix of delegation or re-attachment in render functions for specific elements.
    // However, the render functions in ui.js are handling specifics. We handle high-level here if needed.

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            const user = getMockUser(email);
            if (user && user.password === password) {
                saveSession(user);
                showFlash(`Welcome, ${user.username}`, 'success');
                renderApp();
            } else {
                showFlash('Invalid credentials.', 'error');
            }
        });
    }

    // Switch to Signup
    const showSignupBtn = document.getElementById('show-signup-btn');
    if (showSignupBtn) {
        showSignupBtn.addEventListener('click', () => {
            renderSignupView();
            attachGlobalListeners(); // Re-attach listeners for the new view
        });
    }

    // Switch to Login
    const showLoginBtn = document.getElementById('show-login-btn');
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', () => {
            renderLoginView();
            attachGlobalListeners();
        });
    }

    // Signup Form
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            const confirm = e.target.password_confirm.value;

            if (password !== confirm) return showFlash('Passwords do not match.', 'error');
            if (getMockUser(email)) return showFlash('Account already exists.', 'error');

            saveMockUser({ username: email.split('@')[0], email, role: 'Staff', password });
            showFlash('Account created! Please log in.', 'success');
            renderLoginView();
            attachGlobalListeners();
        });
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearSession();
            renderApp();
            showFlash('Logged out.', 'info');
        });
    }

    // Toggle Map
    const toggleMapBtn = document.getElementById('toggle-map-btn');
    if (toggleMapBtn) {
        toggleMapBtn.addEventListener('click', () => {
            const mapWrapper = document.getElementById('map-wrapper');
            const isOpen = mapWrapper.classList.toggle('open');
            toggleMapBtn.innerHTML = isOpen ? '<i class="ph ph-map-pin-simple-slash"></i> Hide Map' : '<i class="ph ph-map-pin-simple-fill"></i> Show Map';
            if (isOpen) {
                setTimeout(() => {
                    invalidateMapSize();
                    refreshDashboard(); // Re-center markers
                }, 400);
            }
        });
    }

    // Add Parcel Modal
    const addParcelBtn = document.getElementById('add-parcel-btn');
    if (addParcelBtn) {
        addParcelBtn.addEventListener('click', () => {
            document.getElementById('parcel-modal').classList.remove('hidden');
            document.getElementById('parcel-modal').classList.add('flex');
        });
    }

    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('parcel-modal').classList.add('hidden');
            document.getElementById('parcel-modal').classList.remove('flex');
        });
    }

    // Parcel Form
    const parcelForm = document.getElementById('parcel-form');
    if (parcelForm) {
        parcelForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-parcel-btn');
            const formMessage = document.getElementById('form-message');
            const originalText = btn.innerText;

            if (btn.disabled) return;
            btn.disabled = true;
            btn.innerText = 'Validating...';
            formMessage.classList.add('hidden');

            try {
                const trackingId = document.getElementById('tracking-id').value;
                const destination = document.getElementById('destination').value;
                const priority = document.getElementById('priority').value;

                if (!await geocodeAddress(destination)) {
                    formMessage.innerText = '❌ Invalid Location.';
                    formMessage.className = 'text-center text-sm font-semibold p-2 rounded text-red-600 bg-red-100';
                    formMessage.classList.remove('hidden');
                    return;
                }

                btn.innerText = 'Saving...';
                await addShipment({ trackingId, destination, priority, status: 'Scheduled' });

                showFlash(`Parcel Added: ${trackingId}`, 'success');
                document.getElementById('close-modal-btn').click();
                refreshDashboard();
            } catch (err) {
                showFlash(err.message, 'error');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        });
    }

    // Process Next Delivery
    const processBtn = document.getElementById('process-next-delivery-btn');
    if (processBtn) {
        processBtn.addEventListener('click', async () => {
            const all = await fetchShipments();
            const active = all.filter(s => ['Scheduled', 'Processing'].includes(s.status));
            if (!active.length) return showFlash('No active shipments', 'info');

            active.sort((a, b) => {
                const pVal = { High: 3, Medium: 2, Low: 1 };
                if (pVal[a.priority] !== pVal[b.priority]) return pVal[b.priority] - pVal[a.priority];
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
            const target = active[0];
            if (await showConfirmation("Auto-Deliver", `Deliver ${target.trackingId}?`)) {
                await updateShipmentStatus(target.id, 'Delivered');
                refreshDashboard();
                showFlash('Delivered!', 'success');
            }
        });
    }

    // Clear Data
    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (CURRENT_USER.role !== 'Admin') return showFlash('Access Denied', 'error');
            if (await showConfirmation("Clear Data", "Delete ALL records? Type 'DELETE ALL'", true) === 'DELETE ALL') {
                await clearAllShipments();
                refreshDashboard();
                showFlash('All data cleared.', 'success');
            }
        });
    }

    // Return Parcel
    const returnBtn = document.getElementById('add-new-return-btn');
    if (returnBtn) {
        returnBtn.addEventListener('click', async () => {
            const trackId = await showConfirmation("Return", "Enter Tracking ID:", true);
            if (!trackId) return;
            const dest = await showConfirmation("Return", "Enter Destination:", true);
            if (!dest) return;

            try {
                await addShipment({ trackingId: trackId, destination: dest, priority: 'High', status: 'Returned' });
                showFlash('Return Registered', 'success');
                refreshDashboard();
            } catch (e) {
                showFlash('Failed to register return', 'error');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
