import apiClient, { 
  authAPI, 
  processAPI, 
  incidentAPI, 
  reportAPI, 
  requestUtils,
  setAuthToken,
  setupRequestMonitoring
} from '../utils/apiClient.js';

// Example: Basic usage with global request state
export async function basicExample() {
  console.log('=== Basic Request State Example ===');
  
  // Setup monitoring (optional)
  setupRequestMonitoring();
  
  try {
    // Check initial state
    console.log('Initial state:', requestUtils.getGlobalState());
    
    // Login (this will be tracked automatically)
    const loginResult = await authAPI.login({
      email: 'admin@example.com',
      password: 'password123'
    });
    
    // Set auth token for subsequent requests
    setAuthToken(loginResult.token);
    
    // Make multiple requests in parallel (all will be tracked)
    const [processes, incidents] = await Promise.all([
      processAPI.getProcesses({ limit: 10 }),
      incidentAPI.getIncidents({ limit: 5 })
    ]);
    
    console.log('Processes loaded:', processes.length);
    console.log('Incidents loaded:', incidents.length);
    
    // Check final state
    console.log('Final state:', requestUtils.getGlobalState());
    console.log('Statistics:', requestUtils.getStats());
    
  } catch (error) {
    console.error('Example failed:', error.message);
    console.log('Errors in state:', requestUtils.getErrors());
  }
}

// Example: Cache demonstration
export async function cacheExample() {
  console.log('=== Cache Example ===');
  
  try {
    // First request (will hit the server)
    console.time('First request');
    const processes1 = await processAPI.getProcesses();
    console.timeEnd('First request');
    
    // Second request (should use cache)
    console.time('Second request (cached)');
    const processes2 = await processAPI.getProcesses();
    console.timeEnd('Second request (cached)');
    
    console.log('Results match:', JSON.stringify(processes1) === JSON.stringify(processes2));
    
    // Clear cache and request again
    requestUtils.clearCache('GET:/processes');
    
    console.time('Third request (cache cleared)');
    const processes3 = await processAPI.getProcesses();
    console.timeEnd('Third request (cache cleared)');
    
  } catch (error) {
    console.error('Cache example failed:', error.message);
  }
}

// Example: Error handling and retry
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');
  
  try {
    // This should fail (invalid endpoint)
    await apiClient.httpClient.get('/invalid-endpoint');
  } catch (error) {
    console.log('Expected error caught:', error.message);
  }
  
  // Check errors in global state
  const errors = requestUtils.getErrors();
  console.log('Errors in global state:', errors.length);
  
  if (errors.length > 0) {
    console.log('Latest error:', errors[errors.length - 1]);
  }
}

// Example: Request cancellation
export async function cancellationExample() {
  console.log('=== Cancellation Example ===');
  
  // Start a long-running request
  const requestPromise = reportAPI.generateReport({
    type: 'comprehensive',
    dateRange: { start: '2024-01-01', end: '2024-12-31' }
  });
  
  // Cancel after 1 second
  setTimeout(() => {
    console.log('Cancelling all requests...');
    requestUtils.cancelAllRequests();
  }, 1000);
  
  try {
    await requestPromise;
    console.log('Request completed successfully');
  } catch (error) {
    console.log('Request was cancelled or failed:', error.message);
  }
}

// Example: Real-time monitoring
export async function monitoringExample() {
  console.log('=== Monitoring Example ===');
  
  // Subscribe to state changes
  const unsubscribe = requestUtils.onStateChange((state) => {
    console.log(`📊 State Update: Loading: ${state.isLoading}, Pending: ${state.pendingRequests}, Errors: ${state.errors.length}`);
  });
  
  // Subscribe to individual request events
  const unsubscribeStart = requestUtils.onRequestStart(({ requestId, request }) => {
    console.log(`🚀 Request Started: ${request.method} ${request.url} (ID: ${requestId})`);
  });
  
  const unsubscribeComplete = requestUtils.onRequestComplete(({ requestId, request }) => {
    console.log(`✅ Request Completed: ${request.method} ${request.url} in ${request.duration}ms (ID: ${requestId})`);
  });
  
  const unsubscribeFail = requestUtils.onRequestFail(({ requestId, request, error }) => {
    console.log(`❌ Request Failed: ${request.method} ${request.url} - ${error.message} (ID: ${requestId})`);
  });
  
  try {
    // Make some requests to see the monitoring in action
    await Promise.all([
      processAPI.getProcesses(),
      incidentAPI.getIncidents(),
      reportAPI.getReports()
    ]);
    
    // Wait a bit to see final state changes
    await new Promise(resolve => setTimeout(resolve, 100));
    
  } finally {
    // Clean up subscriptions
    unsubscribe();
    unsubscribeStart();
    unsubscribeComplete();
    unsubscribeFail();
  }
}

// Example: Advanced usage with custom options
export async function advancedExample() {
  console.log('=== Advanced Example ===');
  
  try {
    // Request with custom timeout and retry settings
    const customRequest = await apiClient.httpClient.request('/processes', {
      method: 'GET',
      timeout: 5000,      // 5 second timeout
      retries: 1,         // Only retry once
      cache: true,        // Enable caching
      cacheTime: 30000,   // Cache for 30 seconds
      headers: {
        'X-Custom-Header': 'example-value'
      }
    });
    
    console.log('Custom request completed:', !!customRequest);
    
    // Upload example (if you have file upload endpoints)
    // const formData = new FormData();
    // formData.append('file', fileBuffer);
    // const uploadResult = await apiClient.httpClient.upload('/upload', formData);
    
    // Batch operations with state tracking
    const batchResults = await Promise.allSettled([
      processAPI.getProcesses({ status: 'active' }),
      processAPI.getProcesses({ status: 'completed' }),
      incidentAPI.getIncidents({ priority: 'high' }),
      reportAPI.getReports({ type: 'monthly' })
    ]);
    
    const successful = batchResults.filter(result => result.status === 'fulfilled').length;
    const failed = batchResults.filter(result => result.status === 'rejected').length;
    
    console.log(`Batch operations: ${successful} successful, ${failed} failed`);
    
    // Get comprehensive statistics
    const stats = requestUtils.getStats();
    console.log('Final Statistics:', {
      totalRequests: stats.total,
      successRate: `${((stats.completed / stats.total) * 100).toFixed(1)}%`,
      averageResponseTime: `${stats.averageDuration}ms`,
      cacheHitRate: `${stats.cacheHitRate.toFixed(1)}%`,
      errorRate: `${stats.errorRate.toFixed(1)}%`
    });
    
  } catch (error) {
    console.error('Advanced example failed:', error.message);
  }
}

// Run all examples
export async function runAllExamples() {
  console.log('🚀 Starting Request State Management Examples\n');
  
  await basicExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await cacheExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await errorHandlingExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await cancellationExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await monitoringExample();
  console.log('\n' + '='.repeat(50) + '\n');
  
  await advancedExample();
  
  console.log('\n✅ All examples completed!');
}

// Export everything for individual use
export default {
  basicExample,
  cacheExample,
  errorHandlingExample,
  cancellationExample,
  monitoringExample,
  advancedExample,
  runAllExamples
};

// If running this file directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}