// src/lib/db/models/Document.js
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  type:         { type: String, enum: ['notes', 'book', 'reference', 'pyq'], default: 'notes' },
  branch:       { type: String, required: true, index: true },
  semester:     { type: Number, required: true, index: true },
  subject:      { type: String, required: true, index: true },
  academicYear: { type: String, default: '2024-25' },
  author:       { type: String, default: '' },

  // ✅ Cloudinary storage — replaces base64 fileData
  fileUrl:      { type: String, default: '' },    // Cloudinary secure URL
  cloudinaryId: { type: String, default: '' },    // For deletion

  // ✅ Keep fileData for backward compat with existing docs (select: false = not loaded by default)
  fileData:     { type: String, select: false },

  fileSize:         { type: Number,  default: 0 },
  processingStatus: { type: String,  enum: ['pending','processing','completed','failed'], default: 'pending', index: true },
  totalChunks:      { type: Number,  default: 0 },
  uploadedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views:            { type: Number,  default: 0 },
  downloads:        { type: Number,  default: 0 },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

documentSchema.index({ branch: 1, semester: 1 });
documentSchema.index({ subject: 1, type: 1 });

export default mongoose.models.Document ||
  mongoose.model('Document', documentSchema);