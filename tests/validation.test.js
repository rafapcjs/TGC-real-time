import { describe, test, expect } from '@jest/globals';
import { loginSchema, registerSchema } from '../src/schemas/authSchemas.js';
import { createIncidentSchema, resolveIncidentSchema } from '../src/schemas/incidentSchemas.js';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const { error, value } = loginSchema.validate(validData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    test('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      const { error } = loginSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('El email debe tener un formato válido');
    });

    test('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123'
      };

      const { error } = loginSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La contraseña debe tener al menos 6 caracteres');
    });

    test('should reject missing fields', () => {
      const invalidData = {
        email: 'test@example.com'
        // password missing
      };

      const { error } = loginSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La contraseña es requerida');
    });
  });

  describe('registerSchema', () => {
    test('should validate correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'revisor'
      };

      const { error, value } = registerSchema.validate(validData);
      
      expect(error).toBeUndefined();
      expect(value.name).toBe('John Doe');
      expect(value.role).toBe('revisor');
    });

    test('should reject weak password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weakpass', // No uppercase or number
        role: 'revisor'
      };

      const { error } = registerSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
    });

    test('should reject invalid role', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        role: 'invalidrole'
      };

      const { error } = registerSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('El rol debe ser revisor o supervisor');
    });

    test('should trim and validate name', () => {
      const dataWithSpaces = {
        name: '  John Doe  ',
        email: 'john@example.com',
        password: 'Password123',
        role: 'supervisor'
      };

      const { error, value } = registerSchema.validate(dataWithSpaces);
      
      expect(error).toBeUndefined();
      expect(value.name).toBe('John Doe'); // Trimmed
    });
  });

  describe('createIncidentSchema', () => {
    test('should validate correct incident data', () => {
      const validData = {
        processId: '507f1f77bcf86cd799439011',
        description: 'This is a test incident with sufficient description length'
      };

      const { error, value } = createIncidentSchema.validate(validData);
      
      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    test('should reject invalid ObjectId', () => {
      const invalidData = {
        processId: 'invalid-objectid',
        description: 'This is a test incident description'
      };

      const { error } = createIncidentSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('El processId debe ser un ObjectId válido');
    });

    test('should reject short description', () => {
      const invalidData = {
        processId: '507f1f77bcf86cd799439011',
        description: 'Too short'
      };

      const { error } = createIncidentSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La descripción debe tener al menos 10 caracteres');
    });

    test('should reject too long description', () => {
      const invalidData = {
        processId: '507f1f77bcf86cd799439011',
        description: 'A'.repeat(1001) // Too long
      };

      const { error } = createIncidentSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La descripción no puede exceder 1000 caracteres');
    });
  });

  describe('resolveIncidentSchema', () => {
    test('should validate correct resolve data', () => {
      const validData = {
        resolvedAt: new Date().toISOString()
      };

      const { error, value } = resolveIncidentSchema.validate(validData);
      
      expect(error).toBeUndefined();
      expect(value.resolvedAt).toBeInstanceOf(Date);
    });

    test('should allow empty resolve data', () => {
      const { error, value } = resolveIncidentSchema.validate({});
      
      expect(error).toBeUndefined();
      expect(value).toEqual({});
    });

    test('should reject future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const invalidData = {
        resolvedAt: futureDate.toISOString()
      };

      const { error } = resolveIncidentSchema.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('La fecha de resolución no puede ser futura');
    });
  });
});