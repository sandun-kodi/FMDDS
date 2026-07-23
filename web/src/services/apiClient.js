import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5200/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT token if available in sessionStorage or localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('fmdds_token') || localStorage.getItem('fmdds_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Normalize errors and handle 401/403/423 session states
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = {
      status: error.response?.status || 500,
      code: error.response?.data?.code || 'ERR_UNKNOWN',
      message: error.response?.data?.message || error.message || 'An unexpected network error occurred.'
    };

    if (error.response) {
      if (error.response.status === 401) {
        // Clear session on 401 Unauthorized
        sessionStorage.removeItem('fmdds_token');
        sessionStorage.removeItem('fmdds_user');
        localStorage.removeItem('fmdds_token');
        localStorage.removeItem('fmdds_user');

        // Dispatch custom session expired event
        window.dispatchEvent(new CustomEvent('fmdds:session_expired'));
      } else if (error.response.status === 403) {
        normalizedError.message = error.response.data?.message || 'Access Denied: You do not have permission to perform this action.';
      } else if (error.response.status === 404) {
        normalizedError.message = error.response.data?.message || 'Requested resource was not found.';
      } else if (error.response.status === 423) {
        normalizedError.message = error.response.data?.message || 'Account locked due to multiple failed login attempts. Please try again later.';
      }
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
