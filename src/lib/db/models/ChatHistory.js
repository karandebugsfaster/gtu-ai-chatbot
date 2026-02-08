import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    retrievedDocuments: [{
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      title: String,
      relevanceScore: Number,
      chunkIndices: [Number]
    }],
    tokensUsed: Number,
    responseTime: Number,
    model: String
  }
});

const ChatHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  context: {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject'
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    },
    semester: Number,
    mode: {
      type: String,
      enum: ['general', 'subject-specific'],
      default: 'general'
    }
  },
  messages: [MessageSchema],
  totalMessages: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

ChatHistorySchema.index({ user: 1, createdAt: -1 });
ChatHistorySchema.index({ sessionId: 1 });
ChatHistorySchema.index({ 'context.subject': 1 });
ChatHistorySchema.index({ lastActivity: -1 });

export default mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);