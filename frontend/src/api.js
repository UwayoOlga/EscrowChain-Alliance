const API = 'http://localhost:5000';

async function request(path, options = {}) {
    const res = await fetch(`${API}${path}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

export const api = {
    // Auth
    register: (body) => request('/auth/register', { method: 'POST', body }),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    logout: () => request('/auth/logout'),
    status: () => request('/auth/status'),

    // User
    getProfile: () => request('/api/users/me'),
    updateProfile: (body) => request('/api/users/me', { method: 'PATCH', body }),

    // Properties
    getProperties: () => request('/api/properties'),
    getProperty: (id) => request(`/api/properties/${id}`),
    createProperty: (body) => request('/api/properties', { method: 'POST', body }),

    // Leases
    getLeases: () => request('/api/leases'),
    getLease: (id) => request(`/api/leases/${id}`),
    createLease: (body) => request('/api/leases', { method: 'POST', body }),
    updateLeaseStatus: (id, status) => request(`/api/leases/${id}/status`, { method: 'PATCH', body: { status } }),

    // Escrow
    getEscrowByLease: (leaseId) => request(`/api/escrow/lease/${leaseId}`),
    createEscrow: (body) => request('/api/escrow', { method: 'POST', body }),
    updateEscrow: (id, body) => request(`/api/escrow/${id}`, { method: 'PATCH', body }),
};
