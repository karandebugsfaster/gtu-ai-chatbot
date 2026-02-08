import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['core', 'elective'],
    required: true
  },
  credits: {
    type: Number,
    default: 4
  },
  description: String,
  syllabusFile: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

SubjectSchema.index({ subjectCode: 1 });
SubjectSchema.index({ branch: 1, semester: 1 });
SubjectSchema.index({ academicYear: 1 });
SubjectSchema.index({ type: 1 });

export default mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);