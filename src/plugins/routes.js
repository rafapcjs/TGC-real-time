import authRoutes from '../routes/auth.js';
import incidentRoutes from '../routes/incidents.js';
import processRoutes from '../routes/processes.js';
import reportRoutes from '../routes/reports.js';
import adviceRoutes from '../routes/advice.js';
import healthRoutes from '../routes/health.js';

const registerRoutes = async (fastify) => {
  // Register routes with their prefixes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(incidentRoutes, { prefix: '/api/v1/incidents' });
  await fastify.register(processRoutes, { prefix: '/api/v1/processes' });
  await fastify.register(reportRoutes, { prefix: '/api/v1/reports' });
  await fastify.register(adviceRoutes, { prefix: '/api/v1/advice' });
  await fastify.register(healthRoutes);
  
  // Home route
  fastify.get('/', async (request, reply) => {
    return { message: 'TCC Backend API is running' };
  });
};

export default registerRoutes;
