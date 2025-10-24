import Process from '../models/Process.js';
import User from '../models/User.js';

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
    // Permitir acceso a supervisores y administradores
    if (request.user.role !== 'supervisor' && request.user.role !== 'administrador') {
      return reply.status(403).send({ error: 'Solo los supervisores y administradores pueden acceder a esta información' });
    }

    // Obtener todos los procesos para supervisión
    const processes = await Process.find({})
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, createdAt: -1 });

    reply.send(processes.map(process => ({
      id: process._id,
      name: process.name,
      description: process.description,
      status: process.status,
      dueDate: process.dueDate,
      assignedReviewer: process.assignedReviewer,
      createdBy: process.createdBy,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt
    })));
  } catch (error) {
    console.error('Error getting supervisor processes:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const createProcess = async (request, reply) => {
  try {
    // Solo administradores pueden crear procesos
    if (request.user.role !== 'administrador') {
      return reply.status(403).send({ error: 'Solo los administradores pueden crear procesos' });
    }

    const { name, description, dueDate, assignedReviewerId } = request.body;

    if (!name) {
      return reply.status(400).send({ error: 'El nombre del proceso es requerido' });
    }

    let assignedReviewer = null;
    let status = 'pendiente';

    // Si se asigna un revisor, verificar que existe y es revisor
    if (assignedReviewerId) {
      const reviewer = await User.findById(assignedReviewerId);
      if (!reviewer) {
        return reply.status(400).send({ error: 'Revisor no encontrado' });
      }
      if (reviewer.role !== 'revisor') {
        return reply.status(400).send({ error: 'El usuario asignado debe ser un revisor' });
      }
      assignedReviewer = assignedReviewerId;
      status = 'en revisión';
    }

    const newProcess = new Process({
      name,
      description,
      status,
      assignedReviewer,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: request.user.id
    });

    await newProcess.save();
    
    // Populate para la respuesta
    const populatedProcess = await Process.findById(newProcess._id)
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email');

    reply.status(201).send({
      id: populatedProcess._id,
      name: populatedProcess.name,
      description: populatedProcess.description,
      status: populatedProcess.status,
      dueDate: populatedProcess.dueDate,
      assignedReviewer: populatedProcess.assignedReviewer,
      createdBy: populatedProcess.createdBy,
      createdAt: populatedProcess.createdAt
    });
  } catch (error) {
    console.error('Error creating process:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const assignReviewer = async (request, reply) => {
  try {
    // Solo administradores pueden asignar revisores
    if (request.user.role !== 'administrador') {
      return reply.status(403).send({ error: 'Solo los administradores pueden asignar revisores' });
    }

    const { processId } = request.params;
    const { reviewerId } = request.body;

    if (!reviewerId) {
      return reply.status(400).send({ error: 'El ID del revisor es requerido' });
    }

    // Verificar que el proceso existe
    const process = await Process.findById(processId);
    if (!process) {
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    }

    // Verificar que el revisor existe y es revisor
    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      return reply.status(400).send({ error: 'Revisor no encontrado' });
    }
    if (reviewer.role !== 'revisor') {
      return reply.status(400).send({ error: 'El usuario debe ser un revisor' });
    }

    // Actualizar el proceso
    process.assignedReviewer = reviewerId;
    process.status = 'en revisión';
    await process.save();

    const updatedProcess = await Process.findById(processId)
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email');

    reply.send({
      id: updatedProcess._id,
      name: updatedProcess.name,
      description: updatedProcess.description,
      status: updatedProcess.status,
      dueDate: updatedProcess.dueDate,
      assignedReviewer: updatedProcess.assignedReviewer,
      createdBy: updatedProcess.createdBy,
      createdAt: updatedProcess.createdAt
    });
  } catch (error) {
    console.error('Error assigning reviewer:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const getAvailableReviewers = async (request, reply) => {
  try {
    // Solo administradores pueden ver la lista de revisores
    if (request.user.role !== 'administrador') {
      return reply.status(403).send({ error: 'Solo los administradores pueden acceder a esta información' });
    }

    const reviewers = await User.find({ 
      role: 'revisor',
      isActive: true 
    }).select('_id name email');

    reply.send(reviewers.map(reviewer => ({
      id: reviewer._id,
      name: reviewer.name,
      email: reviewer.email
    })));
  } catch (error) {
    console.error('Error getting reviewers:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};