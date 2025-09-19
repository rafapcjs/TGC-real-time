import mongoose from 'mongoose';

const adviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['general', 'proceso', 'incidencia', 'reporte', 'seguridad'],
    default: 'general'
  },
  targetRole: {
    type: String,
    enum: ['todos', 'administrador', 'revisor', 'supervisor'],
    default: 'todos'
  },
  priority: {
    type: String,
    enum: ['baja', 'media', 'alta', 'critica'],
    default: 'media'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validTo: {
    type: Date
  }
}, {
  timestamps: true
});

adviceSchema.index({ isActive: 1, targetRole: 1, category: 1 });
adviceSchema.index({ priority: -1, createdAt: -1 });

adviceSchema.methods.isValidForRole = function(userRole) {
  return this.targetRole === 'todos' || this.targetRole === userRole;
};

adviceSchema.methods.isCurrentlyValid = function() {
  const now = new Date();
  const validFrom = this.validFrom || this.createdAt;
  const validTo = this.validTo;
  
  return this.isActive && 
         validFrom <= now && 
         (!validTo || validTo >= now);
};

export default mongoose.model('Advice', adviceSchema);