import EventEmitter from 'events';

class RequestStateService extends EventEmitter {
  constructor() {
    super();
    this.requests = new Map();
    this.cache = new Map();
    this.globalState = {
      isLoading: false,
      errors: [],
      pendingRequests: 0
    };
  }

  // Generate unique request ID
  generateRequestId(method, url, params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${method}:${url}:${paramsStr}`;
  }

  // Start a new request
  startRequest(requestId, options = {}) {
    const request = {
      id: requestId,
      startTime: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || 30000,
      cache: options.cache || false,
      cacheTime: options.cacheTime || 5 * 60 * 1000, // 5 minutes default
      ...options
    };

    this.requests.set(requestId, request);
    this.globalState.pendingRequests++;
    this.globalState.isLoading = true;

    this.emit('requestStart', { requestId, request });
    this.emit('stateChange', this.globalState);

    // Set timeout
    if (request.timeout) {
      setTimeout(() => {
        if (this.requests.has(requestId) && this.requests.get(requestId).status === 'pending') {
          this.failRequest(requestId, new Error('Request timeout'));
        }
      }, request.timeout);
    }

    return request;
  }

  // Complete a request successfully
  completeRequest(requestId, data, options = {}) {
    const request = this.requests.get(requestId);
    if (!request) return;

    request.status = 'completed';
    request.endTime = Date.now();
    request.duration = request.endTime - request.startTime;
    request.data = data;

    // Cache the result if enabled
    if (request.cache) {
      this.setCache(requestId, data, request.cacheTime);
    }

    this.globalState.pendingRequests--;
    if (this.globalState.pendingRequests === 0) {
      this.globalState.isLoading = false;
    }

    // Remove error if it exists for this request
    this.removeError(requestId);

    this.emit('requestComplete', { requestId, request, data });
    this.emit('stateChange', this.globalState);

    // Clean up completed request after a delay
    setTimeout(() => {
      this.requests.delete(requestId);
    }, 10000); // Keep for 10 seconds for debugging
  }

  // Fail a request
  failRequest(requestId, error) {
    const request = this.requests.get(requestId);
    if (!request) return;

    request.status = 'failed';
    request.endTime = Date.now();
    request.duration = request.endTime - request.startTime;
    request.error = error;

    this.globalState.pendingRequests--;
    if (this.globalState.pendingRequests === 0) {
      this.globalState.isLoading = false;
    }

    // Add error to global state
    this.addError(requestId, error);

    this.emit('requestFail', { requestId, request, error });
    this.emit('stateChange', this.globalState);

    // Retry logic
    if (request.retryCount < request.maxRetries && this.shouldRetry(error)) {
      setTimeout(() => {
        this.retryRequest(requestId);
      }, Math.pow(2, request.retryCount) * 1000); // Exponential backoff
    }
  }

  // Retry a failed request
  retryRequest(requestId) {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'failed') return;

    request.retryCount++;
    request.status = 'pending';
    request.startTime = Date.now();
    delete request.endTime;
    delete request.duration;
    delete request.error;

    this.globalState.pendingRequests++;
    this.globalState.isLoading = true;

    this.emit('requestRetry', { requestId, request });
    this.emit('stateChange', this.globalState);
  }

  // Check if error should trigger a retry
  shouldRetry(error) {
    const retryableErrors = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'SERVER_ERROR_5XX'
    ];
    
    return retryableErrors.some(type => 
      error.message.includes(type) || 
      error.code === type ||
      (error.status >= 500 && error.status < 600)
    );
  }

  // Cache management
  setCache(key, data, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Auto cleanup expired cache
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(pattern) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const [key] of this.cache) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // Error management
  addError(requestId, error) {
    const errorObj = {
      id: requestId,
      message: error.message,
      code: error.code,
      status: error.status,
      timestamp: Date.now(),
      stack: error.stack
    };

    // Remove existing error for this request
    this.removeError(requestId);
    
    this.globalState.errors.push(errorObj);
    
    // Limit errors array size
    if (this.globalState.errors.length > 10) {
      this.globalState.errors = this.globalState.errors.slice(-10);
    }
  }

  removeError(requestId) {
    this.globalState.errors = this.globalState.errors.filter(
      error => error.id !== requestId
    );
  }

  clearErrors() {
    this.globalState.errors = [];
    this.emit('stateChange', this.globalState);
  }

  // Get current state
  getState() {
    return {
      ...this.globalState,
      requests: Array.from(this.requests.values()),
      cacheSize: this.cache.size
    };
  }

  // Get specific request state
  getRequestState(requestId) {
    return this.requests.get(requestId) || null;
  }

  // Cancel a request
  cancelRequest(requestId) {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') return;

    request.status = 'cancelled';
    request.endTime = Date.now();
    request.duration = request.endTime - request.startTime;

    this.globalState.pendingRequests--;
    if (this.globalState.pendingRequests === 0) {
      this.globalState.isLoading = false;
    }

    this.removeError(requestId);

    this.emit('requestCancel', { requestId, request });
    this.emit('stateChange', this.globalState);
  }

  // Cancel all pending requests
  cancelAllRequests() {
    const pendingRequests = Array.from(this.requests.values())
      .filter(request => request.status === 'pending');

    pendingRequests.forEach(request => {
      this.cancelRequest(request.id);
    });
  }

  // Get statistics
  getStats() {
    const requests = Array.from(this.requests.values());
    const completed = requests.filter(r => r.status === 'completed');
    const failed = requests.filter(r => r.status === 'failed');
    const pending = requests.filter(r => r.status === 'pending');

    const avgDuration = completed.length > 0 
      ? completed.reduce((sum, r) => sum + (r.duration || 0), 0) / completed.length 
      : 0;

    return {
      total: requests.length,
      completed: completed.length,
      failed: failed.length,
      pending: pending.length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      averageDuration: Math.round(avgDuration),
      cacheHitRate: this.cache.size > 0 ? (this.cache.size / requests.length) * 100 : 0,
      errorRate: requests.length > 0 ? (failed.length / requests.length) * 100 : 0
    };
  }

  // Debug methods
  logState() {
    console.log('=== Request State Debug ===');
    console.log('Global State:', this.globalState);
    console.log('Active Requests:', Array.from(this.requests.values()));
    console.log('Cache:', Array.from(this.cache.entries()));
    console.log('Stats:', this.getStats());
    console.log('==========================');
  }
}

export default new RequestStateService();