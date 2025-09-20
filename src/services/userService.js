import User from '../models/User.js';
import bcrypt from 'bcryptjs';

class UserService {
  async listUsers(status, isAdmin) {
    let query = {};
    
    // If not admin, only show active users
    if (!isAdmin) {
      query.isActive = true;
    } else if (status !== undefined) {
      // Admin can filter by status
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
      // If status is not 'active' or 'inactive', show all users
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });
    
    return users;
  }
  
  async getUserById(id, isAdmin, currentUserId) {
    let query = { _id: id };
    
    // If not admin, can only see active users and themselves
    if (!isAdmin) {
      if (id !== currentUserId) {
        query.isActive = true;
      }
    }
    
    const user = await User.findOne(query).select('-password');
    return user;
  }
  
  async updateUser(id, updateData, isAdmin, currentUserId) {
    // Validate permissions
    if (!isAdmin && id !== currentUserId) {
      throw new Error('You can only update your own profile');
    }
    
    // Remove sensitive fields that shouldn't be updated directly
    const { password, isActive, ...allowedUpdates } = updateData;
    
    // Only admin can change role and isActive status
    if (!isAdmin) {
      delete allowedUpdates.role;
    }
    
    // Handle password update separately if provided
    if (password) {
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      const salt = await bcrypt.genSalt(12);
      allowedUpdates.password = await bcrypt.hash(password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      allowedUpdates,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  async toggleUserStatus(id) {
    const user = await User.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Prevent admin from deactivating themselves
    if (user.role === 'administrador' && user.isActive) {
      const activeAdminCount = await User.countDocuments({ 
        role: 'administrador', 
        isActive: true 
      });
      
      if (activeAdminCount <= 1) {
        throw new Error('Cannot deactivate the last active administrator');
      }
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    return user.toJSON();
  }
  
  async deleteUser(id) {
    const user = await User.findById(id);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Prevent deleting the last admin
    if (user.role === 'administrador') {
      const adminCount = await User.countDocuments({ role: 'administrador' });
      
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last administrator');
      }
    }
    
    await User.findByIdAndDelete(id);
  }
}

export default new UserService();