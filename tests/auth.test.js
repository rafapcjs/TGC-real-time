import { describe, test, expect, beforeEach } from '@jest/globals';
import User from '../src/models/User.js';
import authService from '../src/services/authService.js';

describe('Authentication Service', () => {
  let testUser;
  let adminUser;

  beforeEach(async () => {
    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'revisor'
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'administrador'
    });
  });

  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password123');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeUndefined(); // Password should not be in response
      expect(typeof result.token).toBe('string');
    });

    test('should fail with invalid email', async () => {
      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    test('should fail with invalid password', async () => {
      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    test('should fail with empty credentials', async () => {
      await expect(
        authService.login('', '')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    test('should register new user successfully by admin', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newpassword123',
        role: 'revisor'
      };

      const user = await authService.register(userData, adminUser);
      
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.password).toBeUndefined(); // Password should not be in response
    });

    test('should fail when non-admin tries to register user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newpassword123',
        role: 'revisor'
      };

      await expect(
        authService.register(userData, testUser)
      ).rejects.toThrow('Only administrators can register new users');
    });

    test('should fail with invalid role', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newpassword123',
        role: 'invalidrole'
      };

      await expect(
        authService.register(userData, adminUser)
      ).rejects.toThrow('Invalid role');
    });

    test('should fail with duplicate email', async () => {
      const userData = {
        name: 'New User',
        email: 'test@example.com', // Email already exists
        password: 'newpassword123',
        role: 'revisor'
      };

      await expect(
        authService.register(userData, adminUser)
      ).rejects.toThrow('User with this email already exists');
    });
  });

  describe('generateToken', () => {
    test('should generate valid JWT token', () => {
      const token = authService.generateToken(testUser);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    test('should verify valid token', () => {
      const token = authService.generateToken(testUser);
      const decoded = authService.verifyToken(token);
      
      expect(decoded.id).toBe(testUser._id.toString());
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
    });

    test('should fail with invalid token', () => {
      expect(() => {
        authService.verifyToken('invalid.token.here');
      }).toThrow('Invalid token');
    });

    test('should fail with malformed token', () => {
      expect(() => {
        authService.verifyToken('not-a-token');
      }).toThrow('Invalid token');
    });
  });
});