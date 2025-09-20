import fetch from 'node-fetch';
import requestStateService from './requestStateService.js';

class HttpClient {
  constructor(baseURL = '', defaultOptions = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      timeout: 30000,
      retries: 3,
      cache: false,
      ...defaultOptions
    };
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
    return () => {
      const index = this.interceptors.request.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.request.splice(index, 1);
      }
    };
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
    return () => {
      const index = this.interceptors.response.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.response.splice(index, 1);
      }
    };
  }

  // Add error interceptor
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
    return () => {
      const index = this.interceptors.error.indexOf(interceptor);
      if (index > -1) {
        this.interceptors.error.splice(index, 1);
      }
    };
  }

  // Execute request interceptors
  async executeRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      try {
        modifiedConfig = await interceptor(modifiedConfig) || modifiedConfig;
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    
    return modifiedConfig;
  }

  // Execute response interceptors
  async executeResponseInterceptors(response, config) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      try {
        modifiedResponse = await interceptor(modifiedResponse, config) || modifiedResponse;
      } catch (error) {
        console.error('Response interceptor error:', error);
      }
    }
    
    return modifiedResponse;
  }

  // Execute error interceptors
  async executeErrorInterceptors(error, config) {
    let modifiedError = error;
    
    for (const interceptor of this.interceptors.error) {
      try {
        const result = await interceptor(modifiedError, config);
        if (result) {
          modifiedError = result;
        }
      } catch (interceptorError) {
        console.error('Error interceptor error:', interceptorError);
      }
    }
    
    return modifiedError;
  }

  // Build full URL
  buildURL(url) {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `${this.baseURL}${url}`;
  }

  // Create request config
  createRequestConfig(url, options = {}) {
    const config = {
      ...this.defaultOptions,
      ...options,
      url: this.buildURL(url),
      method: options.method || 'GET'
    };

    // Generate request ID for state management
    config.requestId = requestStateService.generateRequestId(
      config.method,
      config.url,
      config.body || config.params
    );

    return config;
  }

  // Main request method
  async request(url, options = {}) {
    let config = this.createRequestConfig(url, options);
    
    try {
      // Execute request interceptors
      config = await this.executeRequestInterceptors(config);

      // Check cache first
      if (config.cache) {
        const cachedData = requestStateService.getCache(config.requestId);
        if (cachedData) {
          return cachedData;
        }
      }

      // Start request tracking
      requestStateService.startRequest(config.requestId, {
        url: config.url,
        method: config.method,
        cache: config.cache,
        cacheTime: config.cacheTime,
        timeout: config.timeout,
        maxRetries: config.retries
      });

      // Prepare fetch options
      const fetchOptions = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      };

      // Add body for non-GET requests
      if (config.body && config.method !== 'GET') {
        fetchOptions.body = typeof config.body === 'string' 
          ? config.body 
          : JSON.stringify(config.body);
      }

      // Add query parameters for GET requests
      let requestUrl = config.url;
      if (config.params && config.method === 'GET') {
        const searchParams = new URLSearchParams(config.params);
        requestUrl += `?${searchParams.toString()}`;
      }

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, config.timeout);

      fetchOptions.signal = controller.signal;

      // Make the request
      const response = await fetch(requestUrl, fetchOptions);
      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.statusText = response.statusText;
        error.response = response;
        throw error;
      }

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Execute response interceptors
      const interceptedResponse = await this.executeResponseInterceptors(data, config);

      // Complete request tracking
      requestStateService.completeRequest(config.requestId, interceptedResponse, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      return interceptedResponse;

    } catch (error) {
      // Handle different types of errors
      let processedError = error;

      if (error.name === 'AbortError') {
        processedError = new Error('Request timeout');
        processedError.code = 'TIMEOUT';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        processedError = new Error('Network error');
        processedError.code = 'NETWORK_ERROR';
      } else if (error.status >= 500) {
        processedError.code = 'SERVER_ERROR_5XX';
      } else if (error.status >= 400) {
        processedError.code = 'CLIENT_ERROR_4XX';
      }

      // Execute error interceptors
      const interceptedError = await this.executeErrorInterceptors(processedError, config);

      // Fail request tracking
      requestStateService.failRequest(config.requestId, interceptedError);

      throw interceptedError;
    }
  }

  // Convenience methods
  async get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }

  async post(url, data, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'POST', 
      body: data 
    });
  }

  async put(url, data, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'PUT', 
      body: data 
    });
  }

  async patch(url, data, options = {}) {
    return this.request(url, { 
      ...options, 
      method: 'PATCH', 
      body: data 
    });
  }

  async delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  // Upload file
  async upload(url, formData, options = {}) {
    const config = { 
      ...options, 
      method: 'POST',
      headers: {
        ...options.headers
        // Don't set Content-Type for FormData, let browser set it
      }
    };

    // Remove Content-Type if it's FormData
    if (formData instanceof FormData) {
      delete config.headers['Content-Type'];
      config.body = formData;
    } else {
      config.body = formData;
    }

    return this.request(url, config);
  }

  // Cancel request
  cancelRequest(requestId) {
    requestStateService.cancelRequest(requestId);
  }

  // Cancel all requests
  cancelAllRequests() {
    requestStateService.cancelAllRequests();
  }

  // Get request state
  getRequestState(requestId) {
    return requestStateService.getRequestState(requestId);
  }

  // Get global state
  getGlobalState() {
    return requestStateService.getState();
  }

  // Subscribe to state changes
  onStateChange(callback) {
    requestStateService.on('stateChange', callback);
    return () => requestStateService.off('stateChange', callback);
  }

  // Subscribe to specific request events
  onRequestStart(callback) {
    requestStateService.on('requestStart', callback);
    return () => requestStateService.off('requestStart', callback);
  }

  onRequestComplete(callback) {
    requestStateService.on('requestComplete', callback);
    return () => requestStateService.off('requestComplete', callback);
  }

  onRequestFail(callback) {
    requestStateService.on('requestFail', callback);
    return () => requestStateService.off('requestFail', callback);
  }

  // Clear cache
  clearCache(pattern) {
    requestStateService.clearCache(pattern);
  }

  // Get statistics
  getStats() {
    return requestStateService.getStats();
  }
}

// Create default instance
const httpClient = new HttpClient();

// Add default interceptors

// Request interceptor for adding auth token
httpClient.addRequestInterceptor((config) => {
  // Add auth token if available (you can customize this based on your auth system)
  const token = process.env.AUTH_TOKEN || global.authToken;
  if (token) {
    config.headers = {
      ...config.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return config;
});

// Request interceptor for logging
httpClient.addRequestInterceptor((config) => {
  console.log(`🚀 ${config.method} ${config.url}`);
  return config;
});

// Response interceptor for logging
httpClient.addResponseInterceptor((response, config) => {
  console.log(`✅ ${config.method} ${config.url} completed`);
  return response;
});

// Error interceptor for logging
httpClient.addErrorInterceptor((error, config) => {
  console.error(`❌ ${config.method} ${config.url} failed:`, error.message);
  return error;
});

export { HttpClient };
export default httpClient;