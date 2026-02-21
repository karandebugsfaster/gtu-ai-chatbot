import mongoose from 'mongoose';

const PYQQuestionSchema = new mongoose.Schema({
  // Document reference
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  
  // Academic metadata
  year: { type: Number, required: true, index: true },
  semester: { type: Number, required: true, index: true },
  subject: { type: String, required: true, index: true },
  branch: { type: String, required: true, index: true },
  
  // Question data
  questionNumber: { type: String, required: true },
  questionText: { type: String, required: true, },
  marks: { type: Number, default: 7 },
  section: { type: String, enum: ['A', 'B', 'C'], default: 'A' },
  
  // Embedding for semantic search (384 dimensions)
  embedding: { type: [Number], required: true },
  
  // Metadata
  extractedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound indexes
PYQQuestionSchema.index({ subject: 1, semester: 1, branch: 1, year: 1 });
PYQQuestionSchema.index({ subject: 1, year: -1 });

// Text index
PYQQuestionSchema.index({ questionText: 'text' });

export default mongoose.models.PYQQuestion || mongoose.model('PYQQuestion', PYQQuestionSchema);