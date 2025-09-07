import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea y configura una nueva instancia de Fastify
 * @returns {FastifyInstance} Una instancia configurada de Fastify
 */
const createServer = () => {
  // Crear instancia de Fastify con opciones básicas
  const fastify = Fastify({
    logger: true,
    trustProxy: true,
    routerOptions: {
      ignoreTrailingSlash: true
    }
  });
  
  return fastify;
};

export default createServer;
