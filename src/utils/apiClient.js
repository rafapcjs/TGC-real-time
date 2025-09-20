import httpClient from '../services/httpClient.js';

// Configure base URL from environment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';
httpClient.baseURL = API_BASE_URL;

// Add authentication interceptor
httpClient.addRequestInterceptor((config) => {
  // Get token from global state, environment, or request context
  const token = global.authToken || process.env.AUTH_TOKEN;
  
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  return config;
});

// Add response error interceptor for auth errors
httpClient.addErrorInterceptor((error, config) => {
  if (error.status === 401) {
    // Clear auth token on 401
    delete global.authToken;
    
    // Emit auth error event
    httpClient.emit?.('authError', error);
  }
  
  return error;
});

// API methods using the global state management
export const authAPI = {
  async login(credentials, options = {}) {
    return httpClient.post('/auth/login', credentials, {
      cache: false,
      ...options
    });
  },

  async register(userData, options = {}) {
    return httpClient.post('/auth/register', userData, {
      cache: false,
      ...options
    });
  },

  async refreshToken(options = {}) {
    return httpClient.post('/auth/refresh', {}, {
      cache: false,
      ...options
    });
  }
};

export const processAPI = {
  async getProcesses(params = {}, options = {}) {
    return httpClient.get('/processes', {
      params,
      cache: true,
      cacheTime: 2 * 60 * 1000, // 2 minutes
      ...options
    });
  },

  async getProcess(id, options = {}) {
    return httpClient.get(`/processes/${id}`, {
      cache: true,
      cacheTime: 1 * 60 * 1000, // 1 minute
      ...options
    });
  },

  async createProcess(processData, options = {}) {
    const result = await httpClient.post('/processes', processData, {
      cache: false,
      ...options
    });
    
    // Clear related cache
    httpClient.clearCache('GET:/processes');
    
    return result;
  },

  async updateProcess(id, processData, options = {}) {
    const result = await httpClient.put(`/processes/${id}`, processData, {
      cache: false,
      ...options
    });
    
    // Clear related cache
    httpClient.clearCache(`GET:/processes/${id}`);
    httpClient.clearCache('GET:/processes');
    
    return result;
  },

  async deleteProcess(id, options = {}) {
    const result = await httpClient.delete(`/processes/${id}`, {
      cache: false,
      ...options
    });
    
    // Clear related cache
    httpClient.clearCache(`GET:/processes/${id}`);
    httpClient.clearCache('GET:/processes');
    
    return result;
  }
};

export const incidentAPI = {
  async getIncidents(params = {}, options = {}) {
    return httpClient.get('/incidents', {
      params,
      cache: true,
      cacheTime: 1 * 60 * 1000, // 1 minute
      ...options
    });
  },

  async getIncident(id, options = {}) {
    return httpClient.get(`/incidents/${id}`, {
      cache: true,
      cacheTime: 30 * 1000, // 30 seconds
      ...options
    });
  },

  async createIncident(incidentData, options = {}) {
    const result = await httpClient.post('/incidents', incidentData, {
      cache: false,
      ...options
    });
    
    // Clear related cache
    httpClient.clearCache('GET:/incidents');
    
    return result;
  },

  async updateIncident(id, incidentData, options = {}) {
    const result = await httpClient.put(`/incidents/${id}`, incidentData, {
      cache: false,
      ...options
    });
    
    // Clear related cache
    httpClient.clearCache(`GET:/incidents/${id}`);
    httpClient.clearCache('GET:/incidents');
    
    return result;
  },

  async deleteIncident(id, options = {}) {
    const result = await httpClient.delete(`/incidents/${id}`, {
      cache: false,
      ...options
    });
    
    // Clear related cache
    httpClient.clearCache(`GET:/incidents/${id}`);
    httpClient.clearCache('GET:/incidents');
    
    return result;
  }
};

export const reportAPI = {
  async getReports(params = {}, options = {}) {
    return httpClient.get('/reports', {
      params,
      cache: true,
      cacheTime: 5 * 60 * 1000, // 5 minutes
      ...options
    });
  },

  async getReport(id, options = {}) {
    return httpClient.get(`/reports/${id}`, {
      cache: true,
      cacheTime: 2 * 60 * 1000, // 2 minutes
      ...options
    });
  },

  async generateReport(reportData, options = {}) {
    return httpClient.post('/reports/generate', reportData, {
      cache: false,
      timeout: 60000, // 60 seconds for report generation
      ...options
    });
  },

  async downloadReport(id, format = 'pdf', options = {}) {
    return httpClient.get(`/reports/${id}/download?format=${format}`, {
      cache: true,
      cacheTime: 10 * 60 * 1000, // 10 minutes
      ...options
    });
  }
};

// Utility functions for request state management
export const requestUtils = {
  // Get current request state
  getGlobalState() {
    return httpClient.getGlobalState();
  },

  // Get statistics
  getStats() {
    return httpClient.getStats();
  },

  // Subscribe to state changes
  onStateChange(callback) {
    return httpClient.onStateChange(callback);
  },

  // Subscribe to request events
  onRequestStart(callback) {
    return httpClient.onRequestStart(callback);
  },

  onRequestComplete(callback) {
    return httpClient.onRequestComplete(callback);
  },

  onRequestFail(callback) {
    return httpClient.onRequestFail(callback);
  },

  // Cancel requests
  cancelRequest(requestId) {
    return httpClient.cancelRequest(requestId);
  },

  cancelAllRequests() {
    return httpClient.cancelAllRequests();
  },

  // Clear cache
  clearCache(pattern) {
    return httpClient.clearCache(pattern);
  },

  // Check if loading
  isLoading() {
    const state = httpClient.getGlobalState();
    return state.isLoading;
  },

  // Get errors
  getErrors() {
    const state = httpClient.getGlobalState();
    return state.errors;
  },

  // Get pending requests count
  getPendingRequestsCount() {
    const state = httpClient.getGlobalState();
    return state.pendingRequests;
  }
};

// Set global auth token helper
export const setAuthToken = (token) => {
  global.authToken = token;
};

// Clear global auth token helper
export const clearAuthToken = () => {
  delete global.authToken;
};

// Example usage monitoring setup
export const setupRequestMonitoring = () => {
  // Log all request starts
  requestUtils.onRequestStart(({ requestId, request }) => {
    console.log(`📤 Request started: ${request.method} ${request.url} (${requestId})`);
  });

  // Log all request completions
  requestUtils.onRequestComplete(({ requestId, request }) => {
    console.log(`✅ Request completed: ${request.method} ${request.url} in ${request.duration}ms (${requestId})`);
  });

  // Log all request failures
  requestUtils.onRequestFail(({ requestId, request, error }) => {
    console.error(`❌ Request failed: ${request.method} ${request.url} - ${error.message} (${requestId})`);
  });

  // Log state changes
  requestUtils.onStateChange((state) => {
    if (state.isLoading) {
      console.log(`🔄 Loading: ${state.pendingRequests} pending requests`);
    } else {
      console.log(`✅ All requests completed`);
    }

    if (state.errors.length > 0) {
      console.warn(`⚠️ ${state.errors.length} errors in global state`);
    }
  });

  console.log('🚀 Request monitoring setup completed');
};

// Export everything
export default {
  authAPI,
  processAPI,
  incidentAPI,
  reportAPI,
  requestUtils,
  setAuthToken,
  clearAuthToken,
  setupRequestMonitoring,
  httpClient
};