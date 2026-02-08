import mongoose from 'mongoose';

const GeneratedQuestionSchema = new mongoose.Schema({
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
  difficulty: String,
  source: {
    type: String,
    enum: ['pyq', 'ai-generated'],
    default: 'pyq'
  },
  sourcePYQ: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PYQ'
  },
  alternatives: [String] // For OR questions
});

const SectionSchema = new mongoose.Schema({
  name: String,
  type: String,
  instructions: String,
  totalMarks: Number,
  questions: [GeneratedQuestionSchema]
});

const GeneratedQPSchema = new mongoose.Schema({
  title: {
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
    required: true
  },
  generationType: {
    type: String,
    enum: ['pattern-based', 'topic-based', 'difficulty-based', 'custom'],
    default: 'pattern-based'
  },
  config: {
    totalMarks: Number,
    duration: String,
    questionDistribution: {
      easy: Number,
      medium: Number,
      hard: Number
    },
    unitWeightage: {
      type: Map,
      of: Number
    }
  },
  sections: [SectionSchema],
  analysisUsed: {
    pyqsAnalyzed: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PYQ'
    }],
    yearRange: {
      start: String,
      end: String
    },
    patternDetected: String,
    confidenceScore: Number
  },
  pdfFile: {
    fileName: String,
    filePath: String,
    generatedAt: Date
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

GeneratedQPSchema.index({ subject: 1, createdAt: -1 });
GeneratedQPSchema.index({ generatedBy: 1 });
GeneratedQPSchema.index({ branch: 1, semester: 1 });

export default mongoose.models.GeneratedQP || mongoose.model('GeneratedQP', GeneratedQPSchema);