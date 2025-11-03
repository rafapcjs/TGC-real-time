import Process from '../models/Process.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

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

// CRUD METHODS WITH ROLE-BASED PERMISSIONS

// GET ALL PROCESSES (Admin, Supervisor, Revisor)
export const getAllProcesses = async (request, reply) => {
  try {
    const { role, id: userId } = request.user;
    let query = {};
    let processes;

    switch (role) {
      case 'administrador':
      case 'supervisor':
        // Admin y Supervisor pueden ver todos los procesos
        processes = await Process.find(query)
          .populate('assignedReviewer', 'name email')
          .populate('createdBy', 'name email')
          .sort({ dueDate: 1, createdAt: -1 });
        break;
        
      case 'revisor':
        // Revisor solo puede ver procesos asignados a él
        processes = await Process.find({ assignedReviewer: userId })
          .populate('createdBy', 'name email')
          .sort({ dueDate: 1, createdAt: -1 });
        break;
        
      default:
        return reply.status(403).send({ error: 'Acceso denegado' });
    }

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
    console.error('Error getting all processes:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// GET SINGLE PROCESS BY ID
export const getProcessById = async (request, reply) => {
  try {
    const { id } = request.params;
    const { role, id: userId } = request.user;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ error: 'ID de proceso inválido' });
    }

    const process = await Process.findById(id)
      .populate('assignedReviewer', 'name email')
      .populate('createdBy', 'name email');

    if (!process) {
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    }

    // Verificar permisos
    if (role === 'revisor' && process.assignedReviewer?._id.toString() !== userId) {
      return reply.status(403).send({ error: 'No tienes permisos para ver este proceso' });
    }

    reply.send({
      id: process._id,
      name: process.name,
      description: process.description,
      status: process.status,
      dueDate: process.dueDate,
      assignedReviewer: process.assignedReviewer,
      createdBy: process.createdBy,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt
    });
  } catch (error) {
    console.error('Error getting process by ID:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// UPDATE PROCESS (Admin, Supervisor can update any; Revisor can only update status of assigned processes)
export const updateProcess = async (request, reply) => {
  try {
    const { id } = request.params;
    const { role, id: userId } = request.user;
    const updateData = request.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ error: 'ID de proceso inválido' });
    }

    const process = await Process.findById(id);
    if (!process) {
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    }

    // Verificar permisos y restringir campos según el rol
    switch (role) {
      case 'administrador':
        // Admin puede actualizar todos los campos
        break;
        
      case 'supervisor':
        // Supervisor puede actualizar la mayoría de campos excepto assignedReviewer
        if (updateData.assignedReviewer) {
          return reply.status(403).send({ error: 'Solo los administradores pueden asignar revisores' });
        }
        break;
        
      case 'revisor':
        // Revisor solo puede actualizar el status de procesos asignados a él
        if (process.assignedReviewer?.toString() !== userId) {
          return reply.status(403).send({ error: 'Solo puedes actualizar procesos asignados a ti' });
        }
        // Solo permitir actualizar status
        const allowedFields = ['status'];
        const invalidFields = Object.keys(updateData).filter(field => !allowedFields.includes(field));
        if (invalidFields.length > 0) {
          return reply.status(403).send({ error: `Solo puedes actualizar el campo 'status'. Campos no permitidos: ${invalidFields.join(', ')}` });
        }
        break;
        
      default:
        return reply.status(403).send({ error: 'Acceso denegado' });
    }

    // Validar assignedReviewer si se está actualizando
    if (updateData.assignedReviewer) {
      const reviewer = await User.findById(updateData.assignedReviewer);
      if (!reviewer) {
        return reply.status(400).send({ error: 'Revisor no encontrado' });
      }
      if (reviewer.role !== 'revisor') {
        return reply.status(400).send({ error: 'El usuario asignado debe ser un revisor' });
      }
      // Si se asigna un revisor, cambiar status a 'en revisión'
      updateData.status = 'en revisión';
    }

    // Validar status
    if (updateData.status && !['pendiente', 'en revisión', 'completado'].includes(updateData.status)) {
      return reply.status(400).send({ error: 'Status inválido' });
    }

    // Actualizar el proceso
    const updatedProcess = await Process.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
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
      createdAt: updatedProcess.createdAt,
      updatedAt: updatedProcess.updatedAt
    });
  } catch (error) {
    console.error('Error updating process:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// DELETE PROCESS (Solo Admin)
export const deleteProcess = async (request, reply) => {
  try {
    const { id } = request.params;
    const { role } = request.user;

    // Solo administradores pueden eliminar procesos
    if (role !== 'administrador') {
      return reply.status(403).send({ error: 'Solo los administradores pueden eliminar procesos' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ error: 'ID de proceso inválido' });
    }

    const process = await Process.findById(id);
    if (!process) {
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    }

    await Process.findByIdAndDelete(id);
    
    reply.send({ message: 'Proceso eliminado exitosamente', id });
  } catch (error) {
    console.error('Error deleting process:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// GET PROCESSES BY STATUS (Admin, Supervisor)
export const getProcessesByStatus = async (request, reply) => {
  try {
    const { status } = request.params;
    const { role, id: userId } = request.user;

    if (!['pendiente', 'en revisión', 'completado'].includes(status)) {
      return reply.status(400).send({ error: 'Status inválido' });
    }

    let query = { status };
    
    // Revisor solo puede ver sus procesos asignados
    if (role === 'revisor') {
      query.assignedReviewer = userId;
    } else if (role !== 'administrador' && role !== 'supervisor') {
      return reply.status(403).send({ error: 'Acceso denegado' });
    }

    const processes = await Process.find(query)
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
    console.error('Error getting processes by status:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

// GET PROCESS STATISTICS (Admin, Supervisor)
export const getProcessStatistics = async (request, reply) => {
  try {
    const { role } = request.user;

    if (role !== 'administrador' && role !== 'supervisor') {
      return reply.status(403).send({ error: 'Solo administradores y supervisores pueden ver estadísticas' });
    }

    const stats = await Process.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalProcesses = await Process.countDocuments();
    const overdue = await Process.countDocuments({
      dueDate: { $lt: new Date() },
      status: { $ne: 'completado' }
    });

    const statusCounts = {
      pendiente: 0,
      'en revisión': 0,
      completado: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    reply.send({
      total: totalProcesses,
      overdue,
      byStatus: statusCounts
    });
  } catch (error) {
    console.error('Error getting process statistics:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};