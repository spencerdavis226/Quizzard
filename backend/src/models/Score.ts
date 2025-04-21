import { model, Schema, Document, Types } from 'mongoose';

// Define the Score interface
export interface IScore extends Document {
  user: Types.ObjectId;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionCount: number;
  correctAnswers: number;
  questions?: {
    questionText: string;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
}

// Define the Score schema
const ScoreSchema = new Schema<IScore>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    questionCount: {
      type: Number,
      default: 10,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    questions: [
      {
        questionText: { type: String },
        correctAnswer: { type: String },
        userAnswer: { type: String },
        isCorrect: { type: Boolean },
      },
    ],
  },
  { timestamps: true } // Automatically add createdAt and updatedAt
);

// Export the Score model
export default model<IScore>('Score', ScoreSchema);
