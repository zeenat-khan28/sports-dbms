/**
 * Axios instance with interceptors for API calls.
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api';  // Use relative URL for production (Nginx proxies to backend)

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for admin JWT
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token and redirect to login
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            // Don't redirect if on student pages
            if (!window.location.pathname.startsWith('/student')) {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// ==================== AUTH API ====================
export const authAPI = {
    login: (email, password) => {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        return api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
    signup: (data) => api.post('/auth/signup', data),
    me: () => api.get('/auth/me'),
};

// ==================== SUBMISSIONS API ====================
export const submissionsAPI = {
    getAll: (params = {}) => api.get('/submissions', { params }),
    getOne: (id) => api.get(`/submissions/${id}`),
    update: (id, data) => api.patch(`/submissions/${id}`, data),
    delete: (id) => api.delete(`/submissions/${id}`),
    getSports: () => api.get('/submissions/sports/list'),

    // Student endpoints (require Firebase token)
    create: (data, firebaseToken) => api.post('/submissions', data, {
        headers: { Authorization: `Bearer ${firebaseToken}` }
    }),
    getMy: (firebaseToken) => api.get('/submissions/my', {
        headers: { Authorization: `Bearer ${firebaseToken}` }
    }),
};

// ==================== EVENTS API ====================
export const eventsAPI = {
    getAll: (params = {}) => api.get('/events', { params }),
    getOne: (id) => api.get(`/events/${id}`),
    create: (data) => api.post('/events', data),
    update: (id, data) => api.patch(`/events/${id}`, data),
    delete: (id) => api.delete(`/events/${id}`),
};

// ==================== PARTICIPATION API ====================
export const participationAPI = {
    // Student endpoints
    submit: (data, firebaseToken) => api.post('/participation', data, {
        headers: { Authorization: `Bearer ${firebaseToken}` }
    }),
    getMy: (firebaseToken) => api.get('/participation/my', {
        headers: { Authorization: `Bearer ${firebaseToken}` }
    }),

    // Admin endpoints
    getByEvent: (eventId, params = {}) => api.get(`/participation/event/${eventId}`, { params }),
    updateStatus: (id, data) => api.patch(`/participation/${id}`, data),
};

// ==================== EXPORT API ====================
export const exportAPI = {
    submissionsCSV: (params = {}) => api.get('/export/submissions/csv', {
        params,
        responseType: 'blob'
    }),
    submissionsExcel: (params = {}) => api.get('/export/submissions/excel', {
        params,
        responseType: 'blob'
    }),
    eventParticipants: (eventId) => api.get(`/export/events/${eventId}/participants`, {
        responseType: 'blob'
    }),
};

// ==================== EMAIL API ====================
export const emailAPI = {
    send: (data) => api.post('/email/send', data),
    getLogs: () => api.get('/email/logs'),
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
    getDates: (eventId) => api.get(`/attendance/${eventId}/dates`),
    get: (eventId, date) => api.get(`/attendance/${eventId}`, { params: { attendance_date: date } }),
    save: (eventId, data) => api.post(`/attendance/${eventId}`, data),
};

// ==================== ANALYTICS API ====================
export const analyticsAPI = {
    getOverview: () => api.get('/analytics/overview'),
    getParticipation: () => api.get('/analytics/participation'),
    getEvents: () => api.get('/analytics/events'),
    getAttendance: () => api.get('/analytics/attendance'),
};

export default api;
