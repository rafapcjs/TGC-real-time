import authRoutes from '../routes/auth.js';
import incidentRoutes from '../routes/incidents.js';
import processRoutes from '../routes/processes.js';
import reportRoutes from '../routes/reports.js';

const registerRoutes = async (fastify) => {
  // Register routes with their prefixes
  await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
  await fastify.register(incidentRoutes, { prefix: '/api/v1/incidents' });
  await fastify.register(processRoutes, { prefix: '/api/v1/processes' });
  await fastify.register(reportRoutes, { prefix: '/api/v1/reports' });
  
  // Home route
  fastify.get('/', async (request, reply) => {
    return { message: 'TCC Backend API is running' };
  });
};

export default registerRoutes;
