import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export const propertyService = {
    getAllProperties: async () => {
        const response = await api.get('/api/properties');
        return response.data;
    },
    getPropertyById: async (id: string) => {
        const response = await api.get(`/api/properties/${id}`);
        return response.data;
    },
    createProperty: async (propertyData: any) => {
        const response = await api.post('/api/properties', propertyData);
        return response.data;
    },
};

export const authService = {
    getAuthStatus: async () => {
        const response = await api.get('/auth/status');
        return response.data;
    },
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    register: async (name: string, email: string, password: string, role: string = 'tenant') => {
        const response = await api.post('/auth/register', { name, email, password, role });
        return response.data;
    },
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    },
};

export default api;
