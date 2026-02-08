import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  questionNumber: String,
  questionText: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    required: true
  },
  unit: String,
  topic: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  frequencyCount: {
    type: Number,
    default: 1
  },
  embedding: [Number],
  keywords: [String]
});

const PYQSchema = new mongoose.Schema({
  examName: {
    type: String,
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
  examDate: Date,
  examType: {
    type: String,
    enum: ['regular', 'backlog', 'supplementary'],
    default: 'regular'
  },
  totalMarks: {
    type: Number,
    default: 70
  },
  duration: {
    type: String,
    default: '3 hours'
  },
  fileDetails: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number
  },
  questions: [QuestionSchema],
  analysis: {
    totalQuestions: Number,
    unitWiseDistribution: {
      type: Map,
      of: Number
    },
    topicFrequency: {
      type: Map,
      of: Number
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    },
    repeatedQuestions: [{
      questionText: String,
      count: Number,
      years: [String]
    }]
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  downloads: {
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

PYQSchema.index({ subject: 1, academicYear: 1 });
PYQSchema.index({ branch: 1, semester: 1 });
PYQSchema.index({ examDate: -1 });

export default mongoose.models.PYQ || mongoose.model('PYQ', PYQSchema);