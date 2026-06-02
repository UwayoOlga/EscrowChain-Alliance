const API = 'http://localhost:5000';

async function request(path, options = {}) {
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const res = await fetch(`${API}${path}`, {
        credentials: 'include',
        headers,
        ...options,
        body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
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
    getTenants: () => request('/api/users/tenants'),
    getProspects: (email) => request(`/api/users/prospects?email=${encodeURIComponent(email)}`),

    // Properties
    getProperties: () => request('/api/properties'),
    getProperty: (id) => request(`/api/properties/${id}`),
    createProperty: (body) => request('/api/properties', { method: 'POST', body }),
    updateProperty: (id, body) => request(`/api/properties/${id}`, { method: 'PATCH', body }),
    deleteProperty: (id) => request(`/api/properties/${id}`, { method: 'DELETE' }),

    // Leases
    getLeases: () => request('/api/leases'),
    getLease: (id) => request(`/api/leases/${id}`),
    createLease: (body) => request('/api/leases', { method: 'POST', body }),
    updateLeaseStatus: (id, status) => request(`/api/leases/${id}/status`, { method: 'PATCH', body: { status } }),

    // Escrow
    getEscrowByLease: (leaseId) => request(`/api/escrow/lease/${leaseId}`),
    getTransactions: () => request('/api/escrow/my-transactions'),
    createEscrow: (body) => request('/api/escrow', { method: 'POST', body }),
    updateEscrow: (id, body) => request(`/api/escrow/${id}`, { method: 'PATCH', body }),

    // Disputes
    getDisputes: () => request('/api/disputes'),
    createDispute: (body) => request('/api/disputes', { method: 'POST', body }),
    updateDisputeStatus: (id, status) => request(`/api/disputes/${id}/status`, { method: 'PATCH', body: { status } }),

    // Maintenance
    getMaintenanceRequests: () => request('/api/maintenance'),
    createMaintenanceRequest: (body) => request('/api/maintenance', { method: 'POST', body }),
    updateMaintenanceStatus: (id, status) => request(`/api/maintenance/${id}/status`, { method: 'PATCH', body: { status } }),

    // Documents
    getDocuments: () => request('/api/documents'),
    createDocument: (body) => request('/api/documents', { method: 'POST', body }),

    // Messages
    getMessageContacts: () => request('/api/messages/contacts'),
    getMessages: (userId) => request(`/api/messages/${userId}`),
    sendMessage: (body) => request('/api/messages', { method: 'POST', body }),
};
