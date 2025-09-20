import logger, { logError, logSecurity } from '../config/logger.js';

/**
 * Middleware global de manejo de errores para Fastify
 */
export const globalErrorHandler = (error, request, reply) => {
  // Log del error
  logError(error, {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    userId: request.user?.id,
    requestId: request.id
  });

  // Determinar el código de estado
  let statusCode = error.statusCode || error.status || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code || 'INTERNAL_ERROR';

  // Manejar errores específicos
  if (error.validation) {
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    
    return reply.code(statusCode).send({
      error: {
        code,
        message,
        details: error.validation.map(err => ({
          field: err.dataPath,
          message: err.message,
          value: err.data
        }))
      },
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }

  // Errores de MongoDB
  if (error.name === 'MongoError' || error.name === 'ValidationError') {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    
    if (error.code === 11000) {
      message = 'Duplicate entry found';
      const field = Object.keys(error.keyPattern || {})[0];
      message = `${field} already exists`;
    }
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'INVALID_TOKEN';
    
    // Log de seguridad para tokens inválidos
    logSecurity('INVALID_TOKEN_ATTEMPT', {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      url: request.url,
      token: request.headers.authorization?.substring(0, 20) + '...'
    });
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  }

  // Errores de rate limiting
  if (error.statusCode === 429) {
    code = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests';
    
    logSecurity('RATE_LIMIT_EXCEEDED', {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      url: request.url
    });
  }

  // Errores de permisos
  if (statusCode === 403) {
    code = 'FORBIDDEN';
    message = 'Access forbidden';
    
    logSecurity('FORBIDDEN_ACCESS_ATTEMPT', {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      url: request.url,
      userId: request.user?.id,
      userRole: request.user?.role
    });
  }

  // Errores de CORS
  if (error.message === 'Not allowed by CORS') {
    statusCode = 403;
    code = 'CORS_ERROR';
    message = 'CORS policy violation';
    
    logSecurity('CORS_VIOLATION', {
      ip: request.ip,
      origin: request.headers.origin,
      userAgent: request.headers['user-agent']
    });
  }

  // No exponer detalles internos en producción
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  const errorResponse = {
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error 
      })
    },
    timestamp: new Date().toISOString(),
    path: request.url,
    requestId: request.id
  };

  return reply.code(statusCode).send(errorResponse);
};

/**
 * Middleware para manejar rutas no encontradas
 */
export const notFoundHandler = (request, reply) => {
  logger.warn('Route not found', {
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });

  return reply.code(404).send({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`
    },
    timestamp: new Date().toISOString(),
    path: request.url
  });
};

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
export const asyncHandler = (fn) => {
  return async (request, reply) => {
    try {
      await fn(request, reply);
    } catch (error) {
      throw error; // Fastify se encargará de llamar al error handler
    }
  };
};

/**
 * Validador de entrada personalizado
 */
export const validateInput = (schema) => {
  return async (request, reply) => {
    try {
      const { error, value } = schema.validate(request.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const validationError = new Error('Validation failed');
        validationError.statusCode = 400;
        validationError.validation = error.details;
        throw validationError;
      }

      request.body = value;
    } catch (err) {
      throw err;
    }
  };
};