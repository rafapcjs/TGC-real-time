import sanitizeHtml from 'sanitize-html';
import validator from 'validator';

/**
 * Middleware para validar schemas usando Joi
 */
export const validateSchema = (schema, property = 'body') => {
  return async (request, reply) => {
    try {
      const data = request[property];
      
      // Sanitizar strings antes de validar
      const sanitizedData = sanitizeInputs(data);
      
      const { error, value } = schema.validate(sanitizedData, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const errorMessages = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return reply.code(400).send({
          error: 'Validation failed',
          details: errorMessages
        });
      }
      
      // Reemplazar los datos originales con los validados y sanitizados
      request[property] = value;
    } catch (err) {
      return reply.code(500).send({
        error: 'Internal validation error'
      });
    }
  };
};

/**
 * Sanitiza recursivamente todos los strings en un objeto
 */
const sanitizeInputs = (data) => {
  if (typeof data === 'string') {
    // Sanitizar HTML y escapar caracteres peligrosos
    let sanitized = sanitizeHtml(data, {
      allowedTags: [],
      allowedAttributes: {}
    });
    
    // Escapar caracteres especiales para prevenir XSS
    sanitized = validator.escape(sanitized);
    
    return sanitized.trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeInputs(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInputs(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Middleware para validar que el usuario esté autenticado
 */
export const requireAuth = async (request, reply) => {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return reply.code(401).send({
        error: 'Token de acceso requerido'
      });
    }
    
    const decoded = request.jwt.verify(token);
    request.user = decoded;
  } catch (error) {
    return reply.code(401).send({
      error: 'Token inválido'
    });
  }
};

/**
 * Middleware para validar roles específicos
 */
export const requireRole = (allowedRoles) => {
  return async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Usuario no autenticado'
      });
    }
    
    if (!allowedRoles.includes(request.user.role)) {
      return reply.code(403).send({
        error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`
      });
    }
  };
};

/**
 * Middleware para logging de requests
 */
export const logRequest = async (request, reply) => {
  const start = Date.now();
  
  request.log.info({
    method: request.method,
    url: request.url,
    ip: request.ip,
    userAgent: request.headers['user-agent'],
    userId: request.user?.id
  }, 'Incoming request');
  
  reply.addHook('onSend', (request, reply, payload, done) => {
    const duration = Date.now() - start;
    
    request.log.info({
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration,
      userId: request.user?.id
    }, 'Request completed');
    
    done();
  });
};