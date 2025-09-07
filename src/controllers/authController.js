import authService from '../services/authService.js';

class AuthController {
  async login(request, reply) {
    try {
      const { email, password } = request.body;
      
      if (!email || !password) {
        return reply.code(400).send({ 
          error: 'Email and password are required' 
        });
      }
      
      const result = await authService.login(email, password);
      
      return reply.code(200).send({
        user: result.user,
        token: result.token
      });
    } catch (error) {
      return reply.code(401).send({ 
        error: error.message 
      });
    }
  }
  
  async register(request, reply) {
    try {
      const { name, email, password, role } = request.body;
      
      if (!name || !email || !password || !role) {
        return reply.code(400).send({ 
          error: 'All fields are required: name, email, password, role' 
        });
      }
      
      const user = await authService.register(
        { name, email, password, role }, 
        request.user
      );
      
      return reply.code(201).send({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      });
    } catch (error) {
      return reply.code(400).send({ 
        error: error.message 
      });
    }
  }
}

export default new AuthController();