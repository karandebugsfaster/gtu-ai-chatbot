import mongoose from 'mongoose';

const ChunkSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  pageNumber: Number,
  startIndex: Number,
  endIndex: Number,
  metadata: {
    chapterTitle: String,
    sectionTitle: String,
    keywords: [String]
  }
}, { _id: true });

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['book', 'notes', 'pyq', 'syllabus', 'reference'],
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
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
  fileDetails: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String,
  chunks: [ChunkSchema],
  totalChunks: {
    type: Number,
    default: 0
  },
  metadata: {
    author: String,
    publisher: String,
    edition: String,
    year: String,
    totalPages: Number,
    language: {
      type: String,
      default: 'en'
    },
    isbn: String
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloads: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

DocumentSchema.index({ subject: 1, type: 1 });
DocumentSchema.index({ branch: 1, semester: 1 });
DocumentSchema.index({ processingStatus: 1 });
DocumentSchema.index({ isActive: 1 });

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);