import User from '../models/User.js';
import jwt from 'jsonwebtoken';

class AuthService {
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
  
  async login(email, password) {
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    const token = this.generateToken(user);
    
    return {
      user,
      token
    };
  }
  
  async register(userData, requestingUser) {
    if (requestingUser.role !== 'administrador') {
      throw new Error('Only administrators can register new users');
    }
    
    const { name, email, password, role } = userData;
    
    if (!['revisor', 'supervisor'].includes(role)) {
      throw new Error('Invalid role. Only revisor and supervisor roles can be created');
    }
    
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const user = new User({
      name,
      email,
      password,
      role
    });
    
    await user.save();
    
    return user;
  }
  
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

export default new AuthService();