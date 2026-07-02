export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const API = BASE_URL;

async function request(path, options = {}) {
    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    try {
        const res = await fetch(`${API}${path}`, {
            credentials: 'include',
            headers,
            ...options,
            body: options.body ? (isFormData ? options.body : JSON.stringify(options.body)) : undefined,
        });

        // Handle 401 Unauthorized
        if (res.status === 401 && !path.includes('/auth/login')) {
            window.dispatchEvent(new CustomEvent('unauthorized'));
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    } catch (error) {
        console.error(`API Error [${path}]:`, error.message);
        throw error;
    }
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
    getAuditLogs: () => request('/api/users/audit-logs'),

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

    // Disputes – createDispute accepts FormData so evidence files can be attached
    getDisputes: () => request('/api/disputes'),
    createDispute: (formData) => request('/api/disputes', { method: 'POST', body: formData }),
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

    // Search and Alerts
    globalSearch: (q) => request(`/api/users/search?q=${encodeURIComponent(q)}`),
    getAlerts: () => request('/api/users/alerts'),
};
