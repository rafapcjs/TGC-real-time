import Advice from '../models/Advice.js';
import webSocketService from '../services/websocketService.js';

export const createAdvice = async (request, reply) => {
  try {
    const { title, content, category, targetRole, priority, validFrom, validTo } = request.body;
    const userId = request.user.id;

    if (request.user.role !== 'administrador' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo administradores y supervisores pueden crear consejos' 
      });
    }

    if (!title || !content) {
      return reply.status(400).send({ 
        error: 'Título y contenido son requeridos' 
      });
    }

    const advice = new Advice({
      title,
      content,
      category: category || 'general',
      targetRole: targetRole || 'todos',
      priority: priority || 'media',
      createdBy: userId,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validTo: validTo ? new Date(validTo) : null
    });

    await advice.save();
    await advice.populate('createdBy', 'name email role');

    webSocketService.emitToRoles(['administrador', 'supervisor', 'revisor'], 'new-advice', {
      id: advice._id,
      title: advice.title,
      category: advice.category,
      targetRole: advice.targetRole,
      priority: advice.priority,
      createdBy: advice.createdBy.name
    });

    reply.status(201).send({
      id: advice._id,
      title: advice.title,
      content: advice.content,
      category: advice.category,
      targetRole: advice.targetRole,
      priority: advice.priority,
      isActive: advice.isActive,
      validFrom: advice.validFrom,
      validTo: advice.validTo,
      createdBy: advice.createdBy,
      createdAt: advice.createdAt
    });
  } catch (error) {
    console.error('Error creating advice:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const getAllAdvices = async (request, reply) => {
  try {
    const { category, targetRole, priority, isActive, page = 1, limit = 10 } = request.query;
    
    const filter = {};
    if (category && category !== 'todos') filter.category = category;
    if (targetRole && targetRole !== 'todos') filter.targetRole = targetRole;
    if (priority && priority !== 'todos') filter.priority = priority;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const advices = await Advice.find(filter)
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Advice.countDocuments(filter);

    reply.send({
      advices: advices.map(advice => ({
        id: advice._id,
        title: advice.title,
        content: advice.content,
        category: advice.category,
        targetRole: advice.targetRole,
        priority: advice.priority,
        isActive: advice.isActive,
        validFrom: advice.validFrom,
        validTo: advice.validTo,
        createdBy: advice.createdBy,
        updatedBy: advice.updatedBy,
        createdAt: advice.createdAt,
        updatedAt: advice.updatedAt
      })),
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Error getting advices:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const getAdvicesForUser = async (request, reply) => {
  try {
    const userRole = request.user.role;
    const { category } = request.query;

    const filter = {
      isActive: true,
      $or: [
        { targetRole: 'todos' },
        { targetRole: userRole }
      ]
    };

    if (category && category !== 'todos') {
      filter.category = category;
    }

    const now = new Date();
    filter.validFrom = { $lte: now };
    filter.$or.push(
      { validTo: { $exists: false } },
      { validTo: null },
      { validTo: { $gte: now } }
    );

    const advices = await Advice.find(filter)
      .populate('createdBy', 'name role')
      .sort({ priority: -1, createdAt: -1 });

    reply.send(advices.map(advice => ({
      id: advice._id,
      title: advice.title,
      content: advice.content,
      category: advice.category,
      priority: advice.priority,
      createdBy: advice.createdBy,
      createdAt: advice.createdAt,
      validTo: advice.validTo
    })));
  } catch (error) {
    console.error('Error getting user advices:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const updateAdvice = async (request, reply) => {
  try {
    const { id } = request.params;
    const { title, content, category, targetRole, priority, isActive, validFrom, validTo } = request.body;
    const userId = request.user.id;

    if (request.user.role !== 'administrador' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo administradores y supervisores pueden actualizar consejos' 
      });
    }

    const advice = await Advice.findById(id);
    if (!advice) {
      return reply.status(404).send({ error: 'Consejo no encontrado' });
    }

    if (title) advice.title = title;
    if (content) advice.content = content;
    if (category) advice.category = category;
    if (targetRole) advice.targetRole = targetRole;
    if (priority) advice.priority = priority;
    if (isActive !== undefined) advice.isActive = isActive;
    if (validFrom) advice.validFrom = new Date(validFrom);
    if (validTo !== undefined) advice.validTo = validTo ? new Date(validTo) : null;
    
    advice.updatedBy = userId;

    await advice.save();
    await advice.populate('createdBy', 'name email role');
    await advice.populate('updatedBy', 'name email role');

    webSocketService.emitToRoles(['administrador', 'supervisor', 'revisor'], 'advice-updated', {
      id: advice._id,
      title: advice.title,
      isActive: advice.isActive,
      updatedBy: advice.updatedBy.name
    });

    reply.send({
      id: advice._id,
      title: advice.title,
      content: advice.content,
      category: advice.category,
      targetRole: advice.targetRole,
      priority: advice.priority,
      isActive: advice.isActive,
      validFrom: advice.validFrom,
      validTo: advice.validTo,
      createdBy: advice.createdBy,
      updatedBy: advice.updatedBy,
      updatedAt: advice.updatedAt
    });
  } catch (error) {
    console.error('Error updating advice:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const deleteAdvice = async (request, reply) => {
  try {
    const { id } = request.params;

    if (request.user.role !== 'administrador') {
      return reply.status(403).send({ 
        error: 'Solo administradores pueden eliminar consejos' 
      });
    }

    const advice = await Advice.findById(id);
    if (!advice) {
      return reply.status(404).send({ error: 'Consejo no encontrado' });
    }

    await Advice.findByIdAndDelete(id);

    webSocketService.emitToRoles(['administrador', 'supervisor', 'revisor'], 'advice-deleted', {
      id: advice._id,
      title: advice.title
    });

    reply.send({ message: 'Consejo eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting advice:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const getAdviceById = async (request, reply) => {
  try {
    const { id } = request.params;

    const advice = await Advice.findById(id)
      .populate('createdBy', 'name email role')
      .populate('updatedBy', 'name email role');

    if (!advice) {
      return reply.status(404).send({ error: 'Consejo no encontrado' });
    }

    if (!advice.isValidForRole(request.user.role) && request.user.role !== 'administrador') {
      return reply.status(403).send({ error: 'No tienes permisos para ver este consejo' });
    }

    reply.send({
      id: advice._id,
      title: advice.title,
      content: advice.content,
      category: advice.category,
      targetRole: advice.targetRole,
      priority: advice.priority,
      isActive: advice.isActive,
      validFrom: advice.validFrom,
      validTo: advice.validTo,
      createdBy: advice.createdBy,
      updatedBy: advice.updatedBy,
      createdAt: advice.createdAt,
      updatedAt: advice.updatedAt
    });
  } catch (error) {
    console.error('Error getting advice by id:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const toggleAdviceStatus = async (request, reply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;

    if (request.user.role !== 'administrador' && request.user.role !== 'supervisor') {
      return reply.status(403).send({ 
        error: 'Solo administradores y supervisores pueden cambiar el estado de consejos' 
      });
    }

    const advice = await Advice.findById(id);
    if (!advice) {
      return reply.status(404).send({ error: 'Consejo no encontrado' });
    }

    advice.isActive = !advice.isActive;
    advice.updatedBy = userId;
    
    await advice.save();

    webSocketService.emitToRoles(['administrador', 'supervisor', 'revisor'], 'advice-status-changed', {
      id: advice._id,
      title: advice.title,
      isActive: advice.isActive
    });

    reply.send({
      id: advice._id,
      isActive: advice.isActive,
      message: `Consejo ${advice.isActive ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Error toggling advice status:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};