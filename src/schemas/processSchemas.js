export const createProcessSchema = {
  type: 'object',
  required: ['name'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Nombre del proceso'
    },
    description: {
      type: 'string',
      maxLength: 1000,
      description: 'Descripción del proceso'
    },
    dueDate: {
      type: 'string',
      format: 'date',
      description: 'Fecha límite del proceso'
    },
    assignedReviewerId: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{24}$',
      description: 'ID del revisor asignado (ObjectId válido)'
    }
  },
  additionalProperties: false
};

export const updateProcessSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description: 'Nombre del proceso'
    },
    description: {
      type: 'string',
      maxLength: 1000,
      description: 'Descripción del proceso'
    },
    status: {
      type: 'string',
      enum: ['pendiente', 'en revisión', 'completado'],
      description: 'Estado del proceso'
    },
    dueDate: {
      type: 'string',
      format: 'date',
      description: 'Fecha límite del proceso'
    },
    assignedReviewer: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{24}$',
      description: 'ID del revisor asignado (ObjectId válido)'
    }
  },
  additionalProperties: false
};

export const assignReviewerSchema = {
  type: 'object',
  required: ['reviewerId'],
  properties: {
    reviewerId: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{24}$',
      description: 'ID del revisor (ObjectId válido)'
    }
  },
  additionalProperties: false
};

export const processParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: {
      type: 'string',
      pattern: '^[0-9a-fA-F]{24}$',
      description: 'ID del proceso (ObjectId válido)'
    }
  },
  additionalProperties: false
};

export const statusParamsSchema = {
  type: 'object',
  required: ['status'],
  properties: {
    status: {
      type: 'string',
      enum: ['pendiente', 'en revisión', 'completado'],
      description: 'Estado del proceso'
    }
  },
  additionalProperties: false
};