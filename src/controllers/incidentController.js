import Incident from '../models/Incident.js';
import Process from '../models/Process.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import webSocketService from '../services/websocketService.js';

export const createIncident = async (request, reply) => {
  try {
    if (!request.isMultipart()) {
      return reply.status(400).send({ error: 'Content-Type debe ser multipart/form-data' });
    }

    const parts = request.parts();
    let processId, description;
    let evidenceUrls = [];

    for await (const part of parts) {
      if (part.type === 'field') {
        if (part.fieldname === 'processId') {
          processId = part.value;
        } else if (part.fieldname === 'description') {
          description = part.value;
        }
      } else if (part.type === 'file' && part.fieldname === 'evidence') {
        try {
          const buffer = await part.toBuffer();
          const url = await uploadToCloudinary(buffer, part.filename);
          evidenceUrls.push(url);
        } catch (error) {
          console.error('Error uploading evidence:', error);
        }
      }
    }

    const userId = request.user.id;

    const process = await Process.findById(processId);
    if (!process) {
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    }

    if (request.user.role !== 'revisor') {
      return reply.status(403).send({ error: 'Solo los revisores pueden crear incidencias' });
    }

    const incident = new Incident({
      processId,
      description,
      evidence: evidenceUrls,
      createdBy: userId,
      status: 'pendiente'
    });

    await incident.save();
    await incident.populate('processId', 'name');
    await incident.populate('createdBy', 'name email role');

    // Emit WebSocket event for new incident
    webSocketService.emitToRoles(['supervisor'], 'new-incident', {
      id: incident._id,
      processId: incident.processId._id,
      processName: incident.processId.name,
      description: incident.description,
      createdBy: incident.createdBy.name,
      createdAt: incident.createdAt
    });

    reply.status(201).send({
      id: incident._id,
      processId: incident.processId._id,
      description: incident.description,
      status: incident.status,
      evidence: incident.evidence,
      createdAt: incident.createdAt
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const getIncidentsByProcess = async (request, reply) => {
  try {
    const { processId } = request.params;
    
    const process = await Process.findById(processId);
    if (!process) {
      return reply.status(404).send({ error: 'Proceso no encontrado' });
    }

    const incidents = await Incident.find({ processId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    reply.send(incidents.map(incident => ({
      id: incident._id,
      description: incident.description,
      status: incident.status,
      evidence: incident.evidence,
      createdAt: incident.createdAt,
      resolvedAt: incident.resolvedAt,
      createdBy: incident.createdBy
    })));
  } catch (error) {
    console.error('Error getting incidents by process:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};

export const resolveIncident = async (request, reply) => {
  try {
    const { id } = request.params;
    const { resolvedAt } = request.body;
    const userId = request.user.id;

    const incident = await Incident.findById(id);
    if (!incident) {
      return reply.status(404).send({ error: 'Incidencia no encontrada' });
    }

    if (request.user.role !== 'revisor' && incident.createdBy.toString() !== userId) {
      return reply.status(403).send({ error: 'No tienes permisos para resolver esta incidencia' });
    }

    if (incident.status === 'resuelta') {
      return reply.status(400).send({ error: 'La incidencia ya está resuelta' });
    }

    incident.status = 'resuelta';
    incident.resolvedAt = resolvedAt || new Date();
    
    await incident.save();

    // Emit WebSocket event for resolved incident
    webSocketService.emitToRoles(['supervisor', 'revisor'], 'incident-resolved', {
      incidentId: incident._id,
      resolvedAt: incident.resolvedAt
    });

    reply.send({
      id: incident._id,
      status: incident.status,
      resolvedAt: incident.resolvedAt
    });
  } catch (error) {
    console.error('Error resolving incident:', error);
    reply.status(500).send({ error: 'Error interno del servidor' });
  }
};