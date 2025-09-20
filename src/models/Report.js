import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: false,
    default: null
  },
  filename: {
    type: String,
    required: true
  },
  processIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Process'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

reportSchema.index({ createdBy: 1 });
reportSchema.index({ createdAt: -1 });

export default mongoose.model('Report', reportSchema);