import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['notes', 'book', 'reference', 'pyq'],
    required: [true, 'Type is required']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  academicYear: {
    type: String,
    default: '2024-25'
  },
  author: {
    type: String,
    default: ''
  },
  fileName: String,
  fileSize: Number,
  mimeType: String,
  fileData: String, // base64 encoded
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
documentSchema.index({ branch: 1, semester: 1 });
documentSchema.index({ subject: 1 });
documentSchema.index({ type: 1 });
documentSchema.index({ processingStatus: 1 });

const Document = mongoose.models.Document || mongoose.model('Document', documentSchema);
export default Document;