const AUTH_USER_KEY = 'fleet_auth_user';
const MOCK_USERS_KEY = 'fleet_mock_users';

export let CURRENT_USER = null;

export function getMockUser(email) {
    if (email === 'admin@fleetlogistics.com') return { username: 'Admin', email: email, role: 'Admin', password: 'admin123' };
    if (email === 'customer@example.com') return { username: 'John Doe', email: email, role: 'Customer', password: 'customer123' };
    const storedUsers = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    return storedUsers.find(u => u.email === email) || null;
}

export function saveMockUser(user) {
    if (user.email === 'admin@fleetlogistics.com' || user.email === 'customer@example.com') return;
    const storedUsers = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const filteredUsers = storedUsers.filter(u => u.email !== user.email);
    filteredUsers.push(user);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(filteredUsers));
}

export function loadSession() {
    const user = localStorage.getItem(AUTH_USER_KEY);
    if (user) CURRENT_USER = JSON.parse(user);
    return CURRENT_USER;
}

export function saveSession(user) {
    CURRENT_USER = user;
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearSession() {
    CURRENT_USER = null;
    localStorage.removeItem(AUTH_USER_KEY);
}
