import axios from 'axios';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Halls API
export const hallsAPI = {
    getAll: () => api.get('/halls'),
    getOne: (id) => api.get(`/halls/${id}`),
    create: (data) => api.post('/halls', data),
    update: (id, data) => api.put(`/halls/${id}`, data),
    delete: (id) => api.delete(`/halls/${id}`),
    getPublicVenues: () => api.get('/public/venues'),
};

// Menu API
export const menuAPI = {
    getAll: () => api.get('/menu'),
    create: (data) => api.post('/menu', data),
    update: (id, data) => api.put(`/menu/${id}`, data),
    delete: (id) => api.delete(`/menu/${id}`),
    getCategories: () => api.get('/menu-categories'),
    createCategory: (data) => api.post('/menu-categories', data),
    deleteCategory: (id) => api.delete(`/menu-categories/${id}`),
};

// Customers API
export const customersAPI = {
    getAll: () => api.get('/customers'),
    getOne: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
};

// Bookings API
export const bookingsAPI = {
    getAll: (status) => api.get('/bookings', { params: { status } }),
    getOne: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    cancel: (id) => api.delete(`/bookings/${id}`),
    getInvoice: (id) => api.get(`/bookings/${id}/invoice`, { responseType: 'blob' }),
    getKitchenInvoice: (id) => api.get(`/bookings/${id}/kitchen-invoice`, { responseType: 'blob' }),
    getConfirmed: () => api.get('/confirmed-bookings'),
};

// Payments API
export const paymentsAPI = {
    getAll: (bookingId) => api.get('/payments', { params: { booking_id: bookingId } }),
    create: (data) => api.post('/payments', data),
};

// Party Expenses API (Admin only)
export const partyExpensesAPI = {
    getAll: (bookingId) => api.get(`/party-expenses/${bookingId}`),
    create: (data) => api.post('/party-expenses', data),
    delete: (id) => api.delete(`/party-expenses/${id}`),
};

// Party Planning API (Admin only)
export const partyPlanningAPI = {
    getAll: () => api.get('/party-plans'),
    getOne: (bookingId) => api.get(`/party-plans/${bookingId}`),
    getByBooking: (bookingId) => api.get(`/party-plans/by-booking/${bookingId}`),
    create: (data) => api.post('/party-plans', data),
    update: (bookingId, data) => api.put(`/party-plans/${bookingId}`, data),
    acknowledgeChanges: (bookingId) => api.post(`/party-plans/${bookingId}/acknowledge-changes`),
    suggestStaff: (bookingId) => api.get(`/party-plans/suggest-staff/${bookingId}`),
    generateTimeline: (bookingId) => api.post(`/party-plans/${bookingId}/generate-timeline`),
    updateTimelineTask: (bookingId, taskId, status) => api.put(`/party-plans/${bookingId}/timeline/${taskId}`, null, { params: { status } }),
    getProfitSnapshot: (bookingId) => api.get(`/party-plans/${bookingId}/profit-snapshot`),
};

// Vendor Payments API (Admin only)
export const vendorPaymentsAPI = {
    getAll: (vendorId) => api.get('/vendor-payments', { params: { vendor_id: vendorId } }),
    create: (data) => api.post('/vendor-payments', data),
    getBalanceSheet: () => api.get('/vendor-balance-sheet'),
    addPayable: (vendorId, amount, description) => api.put(`/vendors/${vendorId}/add-payable`, null, { params: { amount, description } }),
};

// Enquiries API (public)
export const enquiriesAPI = {
    create: (data) => api.post('/enquiries', data),
    getAll: () => api.get('/enquiries'),
    markContacted: (id) => api.put(`/enquiries/${id}/contacted`),
};

// Calendar API
export const calendarAPI = {
    getEvents: (month, year) => api.get('/calendar', { params: { month, year } }),
};

// Availability API (public)
export const availabilityAPI = {
    check: (date, hallId) => api.get('/availability', { params: { date, hall_id: hallId } }),
};

// Dashboard API
export const dashboardAPI = {
    getStats: () => api.get('/dashboard/stats'),
    getRevenueChart: () => api.get('/dashboard/revenue-chart'),
    getEventDistribution: () => api.get('/dashboard/event-distribution'),
};

// Seed API
export const seedAPI = {
    seed: () => api.post('/seed'),
};

// Vendor API
export const vendorAPI = {
    getAll: () => api.get('/vendors'),
    getDirectory: () => api.get('/vendors/directory'),
    create: (data) => api.post('/vendors', data),
    update: (id, data) => api.put(`/vendors/${id}`, data),
    delete: (id) => api.delete(`/vendors/${id}`),
    // Ledger
    getLedger: (vendorId) => api.get(`/vendors/${vendorId}/ledger`),
    createTransaction: (vendorId, data) => api.post(`/vendors/${vendorId}/transactions`, data),
    // Legacy assignments
    getAssignments: (bookingId) => api.get('/vendor-assignments', { params: { booking_id: bookingId } }),
    createAssignment: (data) => api.post('/vendor-assignments', data),
    updatePayment: (assignmentId, amount) => api.put(`/vendor-assignments/${assignmentId}/payment`, null, { params: { amount } }),
    // Booking vendors
    getBookingVendors: (bookingId) => api.get(`/bookings/${bookingId}/vendors`),
    assignToBooking: (bookingId, data) => api.post(`/bookings/${bookingId}/vendors`, data),
    updateBookingVendor: (bookingId, assignmentId, data) => api.put(`/bookings/${bookingId}/vendors/${assignmentId}`, data),
    removeFromBooking: (bookingId, assignmentId) => api.delete(`/bookings/${bookingId}/vendors/${assignmentId}`),
    recordPayment: (bookingId, assignmentId, amount, paymentMethod, referenceId, note) => 
        api.post(`/bookings/${bookingId}/vendors/${assignmentId}/pay`, null, { 
            params: { amount, payment_method: paymentMethod, reference_id: referenceId, note } 
        }),
};

// Expense API
export const expenseAPI = {
    getAll: (bookingId, startDate, endDate) => api.get('/expenses', { params: { booking_id: bookingId, start_date: startDate, end_date: endDate } }),
    create: (data) => api.post('/expenses', data),
    delete: (id) => api.delete(`/expenses/${id}`),
};

// Alerts API
export const alertsAPI = {
    getAll: () => api.get('/alerts'),
};

// Analytics API
export const analyticsAPI = {
    getHallUtilization: (startDate, endDate) => api.get('/analytics/hall-utilization', { params: { start_date: startDate, end_date: endDate } }),
    getPeakSeasons: (year) => api.get('/analytics/peak-seasons', { params: { year } }),
    getIdleDays: (hallId, startDate, endDate) => api.get('/analytics/idle-days', { params: { hall_id: hallId, start_date: startDate, end_date: endDate } }),
};

// Financial Reports API
export const reportsAPI = {
    getFinancial: (startDate, endDate) => api.get('/reports/financial', { params: { start_date: startDate, end_date: endDate } }),
    getGstSummary: (year, month) => api.get('/reports/gst-summary', { params: { year, month } }),
};

// Notifications API
export const notificationsAPI = {
    getTemplates: () => api.get('/notifications/templates'),
    updateTemplate: (templateId, template, isActive) => api.put(`/notifications/templates/${templateId}`, null, { params: { template, is_active: isActive } }),
    getLogs: (bookingId) => api.get('/notifications/logs', { params: { booking_id: bookingId } }),
    send: (bookingId, notificationType) => api.post('/notifications/send', null, { params: { booking_id: bookingId, notification_type: notificationType } }),
};

// Super Admin API
export const superAdminAPI = {
    // Stats
    getStats: () => api.get('/superadmin/stats'),
    
    // Tenants
    getTenants: () => api.get('/superadmin/tenants'),
    getTenant: (id) => api.get(`/superadmin/tenants/${id}`),
    createTenant: (data) => api.post('/superadmin/tenants', data),
    updateTenant: (id, data) => api.put(`/superadmin/tenants/${id}`, data),
    deleteTenant: (id) => api.delete(`/superadmin/tenants/${id}`),
    
    // Plans
    getPlans: () => api.get('/superadmin/plans'),
    getPlan: (id) => api.get(`/superadmin/plans/${id}`),
    createPlan: (data) => api.post('/superadmin/plans', data),
    updatePlan: (id, data) => api.put(`/superadmin/plans/${id}`, data),
    deletePlan: (id) => api.delete(`/superadmin/plans/${id}`),
    
    // Tenant Users
    getTenantUsers: (tenantId) => api.get(`/superadmin/tenants/${tenantId}/users`),
    createTenantUser: (tenantId, data) => api.post(`/superadmin/tenants/${tenantId}/users`, data),
    updateTenantUser: (tenantId, userId, data) => api.put(`/superadmin/tenants/${tenantId}/users/${userId}`, data),
    deleteTenantUser: (tenantId, userId) => api.delete(`/superadmin/tenants/${tenantId}/users/${userId}`),
    
    // Country configs
    getCountries: () => api.get('/superadmin/countries'),
    
    // Tenant Config
    getTenantConfig: (tenantId) => api.get(`/superadmin/tenants/${tenantId}/config`),
    updateTenantConfig: (tenantId, data) => api.put(`/superadmin/tenants/${tenantId}/config`, data),
    updateFeatureFlags: (tenantId, flags) => api.put(`/superadmin/tenants/${tenantId}/config/feature-flags`, flags),
    updateWorkflowRules: (tenantId, rules) => api.put(`/superadmin/tenants/${tenantId}/config/workflow-rules`, rules),
    updatePermissions: (tenantId, permissions) => api.put(`/superadmin/tenants/${tenantId}/config/permissions`, permissions),
    getConfigVersions: (tenantId) => api.get(`/superadmin/tenants/${tenantId}/config/versions`),
    rollbackConfig: (tenantId, version) => api.post(`/superadmin/tenants/${tenantId}/config/rollback`, null, { params: { version } }),
    resetTenantData: (tenantId) => api.post(`/superadmin/tenants/${tenantId}/reset-data`, null, { params: { confirm: true } }),
};

// Config sync for tenant apps
export const configAPI = {
    sync: () => api.get('/config/sync'),
    checkVersion: (currentVersion) => api.get('/config/check-version', { params: { current_version: currentVersion } }),
};

export default api;
