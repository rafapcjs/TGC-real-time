import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import config from '../config/appConfig.js';

/**
 * Registra todos los plugins de Fastify necesarios
 * @param {FastifyInstance} fastify - La instancia de Fastify
 */
const registerPlugins = async (fastify) => {
  // Configuración de CORS
  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Permitir solo el frontend y Postman (origen null)
      if (!origin || config.cors.allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'));
      }
    }
  });
  
  // Configuración de JWT
  await fastify.register(jwt, {
    secret: config.jwt.secret
  });

  // Configuración de manejo de archivos
  await fastify.register(multipart, {
    limits: {
      fileSize: config.uploads.maxFileSize
    }
  });
};

export default registerPlugins;
