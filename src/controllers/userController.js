import userService from '../services/userService.js';

class UserController {
  async listUsers(request, reply) {
    try {
      const { status } = request.query;
      const isAdmin = request.user.role === 'administrador';
      
      const users = await userService.listUsers(status, isAdmin);
      
      return reply.code(200).send(users);
    } catch (error) {
      return reply.code(500).send({ 
        error: error.message 
      });
    }
  }
  
  async getUserById(request, reply) {
    try {
      const { id } = request.params;
      const isAdmin = request.user.role === 'administrador';
      const currentUserId = request.user._id.toString();
      
      const user = await userService.getUserById(id, isAdmin, currentUserId);
      
      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }
      
      return reply.code(200).send(user);
    } catch (error) {
      return reply.code(500).send({ 
        error: error.message 
      });
    }
  }
  
  async updateUser(request, reply) {
    try {
      const { id } = request.params;
      const updateData = request.body;
      const isAdmin = request.user.role === 'administrador';
      const currentUserId = request.user._id.toString();
      
      const updatedUser = await userService.updateUser(id, updateData, isAdmin, currentUserId);
      
      return reply.code(200).send(updatedUser);
    } catch (error) {
      return reply.code(400).send({ 
        error: error.message 
      });
    }
  }
  
  async toggleUserStatus(request, reply) {
    try {
      const { id } = request.params;
      
      const updatedUser = await userService.toggleUserStatus(id);
      
      return reply.code(200).send({
        message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
        user: updatedUser
      });
    } catch (error) {
      return reply.code(400).send({ 
        error: error.message 
      });
    }
  }
  
  async deleteUser(request, reply) {
    try {
      const { id } = request.params;
      
      await userService.deleteUser(id);
      
      return reply.code(200).send({
        message: 'User deleted successfully'
      });
    } catch (error) {
      return reply.code(400).send({ 
        error: error.message 
      });
    }
  }
}

export default new UserController();