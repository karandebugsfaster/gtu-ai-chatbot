import mongoose from 'mongoose';

const embeddingChunkSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    pageNumber: Number,
    chunkIndex: Number,
    startChar: Number,
    endChar: Number
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false
});

// Compound index for efficient retrieval
embeddingChunkSchema.index({ documentId: 1, 'metadata.pageNumber': 1 });
embeddingChunkSchema.index({ subject: 1, createdAt: -1 });

const EmbeddingChunk = mongoose.models.EmbeddingChunk || mongoose.model('EmbeddingChunk', embeddingChunkSchema);

export default EmbeddingChunk;