import Process from '../models/Process.js';

export const getReviewerProcesses = async (request, reply) => {
  try {
    const userId = request.user.id;
    
    if (request.user.role !== 'revisor') {
      return reply.status(403).send({ error: 'Solo los revisores pueden acceder a esta información' });
    }

    const processes = await Process.find({ assignedReviewer: userId })
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    reply.send(processes.map(process => ({
      id: process._id,
      name: process.name,
      description: process.description,
      status: process.status,
      dueDate: process.dueDate,
      createdAt: process.createdAt,
      createdBy: process.createdBy
    })));
  } catch (error) {
    console.error('Error getting reviewer processes:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const getSupervisorProcesses = async (request, reply) => {
  try {
    if (request.user.role !== 'supervisor') {
      return reply.status(403).send({ error: 'Solo los supervisores pueden acceder a esta información' });
    }

    const processes = await Process.find({ status: 'en revisión' })
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    reply.send(processes.map(process => ({
      id: process._id,
      name: process.name,
      status: process.status,
      dueDate: process.dueDate
    })));
  } catch (error) {
    console.error('Error getting supervisor processes:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};