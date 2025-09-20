import winston from 'winston';
import config from './appConfig.js';

// Definir formatos de logging
const { combine, timestamp, errors, json, printf, colorize } = winston.format;

// Formato personalizado para desarrollo
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += `\n${JSON.stringify(meta, null, 2)}`;
  }
  
  return log;
});

// Formato para producción (JSON estructurado)
const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  json()
);

// Configuración de transports
const transports = [];

// Console transport (siempre activo)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' 
      ? prodFormat
      : combine(
          colorize(),
          timestamp({ format: 'HH:mm:ss' }),
          devFormat
        )
  })
);

// File transports para producción
if (process.env.NODE_ENV === 'production') {
  // Log de errores
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: prodFormat,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles
    })
  );
  
  // Log combinado
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: prodFormat,
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles
    })
  );
  
  // Log de acceso/auditoria
  transports.push(
    new winston.transports.File({
      filename: 'logs/access.log',
      level: 'info',
      format: combine(
        timestamp(),
        json(),
        winston.format((info) => {
          // Solo logs de acceso
          return info.type === 'access' ? info : false;
        })()
      ),
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles
    })
  );
}

// Crear logger principal
const logger = winston.createLogger({
  level: config.logging.level,
  format: prodFormat,
  defaultMeta: { 
    service: 'tcc-backend',
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  exitOnError: false
});

// Logger específico para requests HTTP
export const accessLogger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { 
    service: 'tcc-backend-access',
    type: 'access'
  },
  transports: process.env.NODE_ENV === 'production' 
    ? [
        new winston.transports.File({
          filename: 'logs/access.log',
          maxsize: config.logging.maxSize,
          maxFiles: config.logging.maxFiles
        })
      ]
    : [new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'HH:mm:ss' }),
          printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [ACCESS]: ${message} ${JSON.stringify(meta)}`;
          })
        )
      })]
});

// Logger para errores de seguridad
export const securityLogger = winston.createLogger({
  level: 'warn',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { 
    service: 'tcc-backend-security',
    type: 'security'
  },
  transports: process.env.NODE_ENV === 'production'
    ? [
        new winston.transports.File({
          filename: 'logs/security.log',
          maxsize: config.logging.maxSize,
          maxFiles: config.logging.maxFiles
        })
      ]
    : [new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'HH:mm:ss' }),
          printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [SECURITY]: ${message} ${JSON.stringify(meta)}`;
          })
        )
      })]
});

// Métodos de utilidad
export const logRequest = (req, res, responseTime) => {
  accessLogger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    userId: req.user?.id,
    userRole: req.user?.role
  });
};

export const logError = (error, context = {}) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    ...context
  });
};

export const logSecurity = (event, details = {}) => {
  securityLogger.warn('Security Event', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export const logPerformance = (operation, duration, metadata = {}) => {
  logger.info('Performance Metric', {
    operation,
    duration: `${duration}ms`,
    ...metadata
  });
};

// Handle uncaught exceptions
if (process.env.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      maxsize: config.logging.maxSize,
      maxFiles: config.logging.maxFiles
    })
  );
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    });
  });
}

export default logger;