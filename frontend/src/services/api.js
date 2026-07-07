import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add authorization tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear credentials on unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/verify')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication & Approval
  auth: {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    getMe: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.put('/auth/me', data),
    resetPassword: (data) => apiClient.post('/auth/reset-password', data),
    getPending: () => apiClient.get('/auth/pending-approvals'),
    approve: (userId, approve) => apiClient.post('/auth/approve', { user_id: userId, approve }),
    getActivityLogs: () => apiClient.get('/auth/activity-logs'),
    getPartners: (role) => apiClient.get('/auth/partners', { params: { role } }),
  },

  // Medicine & Batch Management
  medicine: {
    createCatalog: (data) => apiClient.post('/medicine/catalog', data),
    getCatalog: () => apiClient.get('/medicine/catalog'),
    createBatch: (data) => apiClient.post('/medicine/batches', data),
    bulkUploadBatches: (formData) => {
      return apiClient.post('/medicine/batches/bulk-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    getBatches: () => apiClient.get('/medicine/batches'),
    getBatchDetails: (batchNum) => apiClient.get(`/medicine/batches/${batchNum}`),
  },

  // Shipments & Location Handovers
  tracking: {
    createShipment: (data) => apiClient.post('/tracking/shipments', data),
    getShipments: () => apiClient.get('/tracking/shipments'),
    updateLocation: (shipmentId, data) => apiClient.put(`/tracking/shipments/${shipmentId}/location`, data),
    receiveShipment: (shipmentId, data) => apiClient.put(`/tracking/shipments/${shipmentId}/receive`, data),
    getTimeline: (serial) => apiClient.get(`/tracking/verify/${serial}/timeline`),
  },

  // AI & Outlier Detection
  ai: {
    scanVerify: (data) => apiClient.post('/ai/scan-verify', data),
    predictRisk: (data) => apiClient.post('/ai/predict-risk', data),
    getAnomalies: () => apiClient.get('/ai/anomalies'),
  },

  // OpenCV Computer Vision Verification
  opencv: {
    verifyPackage: (formData) => {
      return apiClient.post('/opencv/verify-package', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  },

  // Public Consumer verification
  consumer: {
    verify: (serial) => apiClient.get(`/consumer/verify/${serial}`),
    reportCounterfeit: (data) => apiClient.post('/consumer/report', data),
    submitFeedback: (data) => apiClient.post('/consumer/feedback', data),
  },

  // Regulatory Compliance Management
  regulatory: {
    getStats: () => apiClient.get('/regulatory/dashboard-stats'),
    getHighRisk: () => apiClient.get('/regulatory/high-risk-suppliers'),
    recallBatch: (batchNum) => apiClient.post(`/regulatory/recall/${batchNum}`),
    getMapPoints: () => apiClient.get('/regulatory/counterfeit-map'),
    getStatistics: () => apiClient.get('/regulatory/monthly-statistics'),
    getPDFExportUrl: () => `${apiClient.defaults.baseURL}/regulatory/export-pdf?token=${localStorage.getItem('token')}`,
  },
};
