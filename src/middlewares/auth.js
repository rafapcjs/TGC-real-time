import User from '../models/User.js';

export const verifyToken = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return reply.code(401).send({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }
    
    const decoded = await request.jwtVerify();
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return reply.code(401).send({ error: 'User not found' });
    }
    
    request.user = user;
  } catch (error) {
    return reply.code(401).send({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (request, reply) => {
  if (request.user.role !== 'administrador') {
    return reply.code(403).send({ error: 'Admin access required' });
  }
};

export const requireSupervisor = async (request, reply) => {
  if (request.user.role !== 'administrador' && request.user.role !== 'supervisor') {
    return reply.code(403).send({ error: 'Supervisor or admin access required' });
  }
};