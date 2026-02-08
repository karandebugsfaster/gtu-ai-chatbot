import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  branchCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  branchName: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    default: 'Engineering'
  },
  description: String,
  isActive: {
    type: Boolean,
    default: true
  },
  totalSemesters: {
    type: Number,
    default: 8
  }
}, {
  timestamps: true
});

BranchSchema.index({ branchCode: 1 });
BranchSchema.index({ isActive: 1 });

export default mongoose.models.Branch || mongoose.model('Branch', BranchSchema);