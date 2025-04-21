import { model, Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  mana: number;
  mageMeter: number;
  friends: Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 12,
      validate: {
        validator: (v: string) => /^[a-zA-Z0-9_]+$/.test(v),
        message: 'Username can only contain letters, numbers, and underscores.',
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v),
        message: 'Invalid email format.',
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 1024,
      select: false, // Do not return password in queries
    },
    mana: {
      type: Number,
      default: 0,
    },
    mageMeter: {
      type: Number,
      default: 0,
    },
    // friends is an array of ObjectId references to other User documents
    friends: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model<IUser>('User', UserSchema);
