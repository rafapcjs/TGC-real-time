import requestStateService from '../services/requestStateService.js';

// Fastify plugin for request state management
export async function requestStateMiddleware(fastify, options) {
  // Add request state service to fastify instance
  fastify.decorate('requestState', requestStateService);

  // Hook into onRequest to track incoming requests
  fastify.addHook('onRequest', async (request, reply) => {
    const requestId = requestStateService.generateRequestId(
      request.method,
      request.url,
      request.body || request.query
    );

    // Store request ID for later use
    request.requestId = requestId;

    // Start tracking the request
    requestStateService.startRequest(requestId, {
      url: request.url,
      method: request.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      cache: false // Server requests typically don't use cache
    });
  });

  // Hook into onResponse to track request completion
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.requestId) {
      const responseData = {
        statusCode: reply.statusCode,
        headers: reply.getHeaders()
      };

      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        requestStateService.completeRequest(request.requestId, responseData);
      } else {
        const error = new Error(`HTTP ${reply.statusCode}`);
        error.status = reply.statusCode;
        requestStateService.failRequest(request.requestId, error);
      }
    }
  });

  // Hook into onError to track request failures
  fastify.addHook('onError', async (request, reply, error) => {
    if (request.requestId) {
      requestStateService.failRequest(request.requestId, error);
    }
  });

  // Add routes for monitoring request state
  fastify.get('/api/request-state', async (request, reply) => {
    return requestStateService.getState();
  });

  fastify.get('/api/request-state/stats', async (request, reply) => {
    return requestStateService.getStats();
  });

  fastify.post('/api/request-state/clear-cache', async (request, reply) => {
    const { pattern } = request.body || {};
    requestStateService.clearCache(pattern);
    return { success: true, message: 'Cache cleared' };
  });

  fastify.post('/api/request-state/clear-errors', async (request, reply) => {
    requestStateService.clearErrors();
    return { success: true, message: 'Errors cleared' };
  });

  fastify.delete('/api/request-state/cancel/:requestId', async (request, reply) => {
    const { requestId } = request.params;
    requestStateService.cancelRequest(requestId);
    return { success: true, message: `Request ${requestId} cancelled` };
  });

  fastify.delete('/api/request-state/cancel-all', async (request, reply) => {
    requestStateService.cancelAllRequests();
    return { success: true, message: 'All requests cancelled' };
  });

  // WebSocket support for real-time state updates
  if (fastify.websocketServer) {
    fastify.get('/ws/request-state', { websocket: true }, (connection, request) => {
      // Send current state immediately
      connection.send(JSON.stringify({
        type: 'state',
        data: requestStateService.getState()
      }));

      // Listen for state changes
      const stateChangeHandler = (state) => {
        if (connection.readyState === connection.OPEN) {
          connection.send(JSON.stringify({
            type: 'stateChange',
            data: state
          }));
        }
      };

      const requestStartHandler = (data) => {
        if (connection.readyState === connection.OPEN) {
          connection.send(JSON.stringify({
            type: 'requestStart',
            data
          }));
        }
      };

      const requestCompleteHandler = (data) => {
        if (connection.readyState === connection.OPEN) {
          connection.send(JSON.stringify({
            type: 'requestComplete',
            data
          }));
        }
      };

      const requestFailHandler = (data) => {
        if (connection.readyState === connection.OPEN) {
          connection.send(JSON.stringify({
            type: 'requestFail',
            data
          }));
        }
      };

      // Subscribe to events
      requestStateService.on('stateChange', stateChangeHandler);
      requestStateService.on('requestStart', requestStartHandler);
      requestStateService.on('requestComplete', requestCompleteHandler);
      requestStateService.on('requestFail', requestFailHandler);

      // Handle connection close
      connection.on('close', () => {
        requestStateService.off('stateChange', stateChangeHandler);
        requestStateService.off('requestStart', requestStartHandler);
        requestStateService.off('requestComplete', requestCompleteHandler);
        requestStateService.off('requestFail', requestFailHandler);
      });

      // Handle incoming messages for controlling state
      connection.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          switch (data.type) {
            case 'getState':
              connection.send(JSON.stringify({
                type: 'state',
                data: requestStateService.getState()
              }));
              break;
              
            case 'getStats':
              connection.send(JSON.stringify({
                type: 'stats',
                data: requestStateService.getStats()
              }));
              break;
              
            case 'clearCache':
              requestStateService.clearCache(data.pattern);
              connection.send(JSON.stringify({
                type: 'success',
                message: 'Cache cleared'
              }));
              break;
              
            case 'clearErrors':
              requestStateService.clearErrors();
              connection.send(JSON.stringify({
                type: 'success',
                message: 'Errors cleared'
              }));
              break;
              
            case 'cancelRequest':
              if (data.requestId) {
                requestStateService.cancelRequest(data.requestId);
                connection.send(JSON.stringify({
                  type: 'success',
                  message: `Request ${data.requestId} cancelled`
                }));
              }
              break;
              
            case 'cancelAllRequests':
              requestStateService.cancelAllRequests();
              connection.send(JSON.stringify({
                type: 'success',
                message: 'All requests cancelled'
              }));
              break;
              
            default:
              connection.send(JSON.stringify({
                type: 'error',
                message: `Unknown message type: ${data.type}`
              }));
          }
        } catch (error) {
          connection.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
    });
  }
}

// Export as default for ES6 compatibility
export default requestStateMiddleware;