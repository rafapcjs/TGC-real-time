import Joi from 'joi';

export const createIncidentSchema = Joi.object({
  processId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'El processId debe ser un ObjectId válido',
      'any.required': 'El processId es requerido'
    }),
  description: Joi.string()
    .min(10)
    .max(1000)
    .trim()
    .required()
    .messages({
      'string.min': 'La descripción debe tener al menos 10 caracteres',
      'string.max': 'La descripción no puede exceder 1000 caracteres',
      'any.required': 'La descripción es requerida'
    })
});

export const resolveIncidentSchema = Joi.object({
  resolvedAt: Joi.date()
    .iso()
    .max('now')
    .optional()
    .messages({
      'date.format': 'La fecha debe estar en formato ISO',
      'date.max': 'La fecha de resolución no puede ser futura'
    })
});

export const assignIncidentSchema = Joi.object({
  revisorId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'El revisorId debe ser un ObjectId válido',
      'any.required': 'El revisorId es requerido'
    })
});

export const incidentParamsSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'El id debe ser un ObjectId válido',
      'any.required': 'El id es requerido'
    }),
  processId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El processId debe ser un ObjectId válido'
    })
});