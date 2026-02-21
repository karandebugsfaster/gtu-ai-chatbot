import mongoose from 'mongoose';

const DiagramSchema = new mongoose.Schema({
  // Document reference
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  documentTitle: { type: String, required: true },
  
  // Location metadata
  pageNumber: { type: Number, required: true },
  figureNumber: { type: String },
  
  // Text metadata
  captionText: { type: String, index: 'text' },
  contextText: { type: String, index: 'text' },
  
  // Image data
  imageUrl: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  imageFormat: { type: String },
  dimensions: {
    width: Number,
    height: Number
  },
  
  // Classification
  imageType: { 
    type: String, 
    enum: ['diagram', 'circuit', 'graph', 'chart', 'illustration', 'other'],
    default: 'diagram'
  },
  
  // Academic metadata
  subject: { type: String, index: true },
  semester: { type: Number, index: true },
  branch: { type: String, index: true },
  
  // User upload tracking
  sessionId: { type: String, index: true },
  isUserUpload: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Timestamps
  extractedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound indexes
DiagramSchema.index({ documentId: 1, pageNumber: 1 });
DiagramSchema.index({ subject: 1, semester: 1, branch: 1 });
DiagramSchema.index({ sessionId: 1, isUserUpload: 1 });

// Text index
DiagramSchema.index({ captionText: 'text', contextText: 'text' });

export default mongoose.models.Diagram || mongoose.model('Diagram', DiagramSchema);