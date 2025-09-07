import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  processId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Process',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pendiente', 'resuelta'],
    default: 'pendiente'
  },
  evidence: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

incidentSchema.index({ processId: 1, status: 1 });
incidentSchema.index({ createdBy: 1 });

export default mongoose.model('Incident', incidentSchema);