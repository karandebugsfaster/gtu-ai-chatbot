import mongoose from 'mongoose';

const embeddingChunkSchema = new mongoose.Schema({
  documentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  documentTitle: { type: String,  default: '' },
  text:          { type: String,  required: true },
  embedding:     { type: [Number] },   // ✅ optional, no default, no required
  branch:        { type: String  },
  semester:      { type: Number  },
  subject:       { type: String  },
  type:          { type: String  },
  chunkIndex:    { type: Number,  default: 0 },
  totalChunks:   { type: Number,  default: 0 },
}, {
  timestamps: true,
  strict: true,
});

embeddingChunkSchema.index({ branch: 1, semester: 1 });
embeddingChunkSchema.index({ documentId: 1, chunkIndex: 1 });
embeddingChunkSchema.index({ subject: 1 });

// ✅ Delete cached model to avoid "Cannot overwrite model" error
delete mongoose.connection.models['EmbeddingChunk'];

export default mongoose.models.EmbeddingChunk ||
  mongoose.model('EmbeddingChunk', embeddingChunkSchema);