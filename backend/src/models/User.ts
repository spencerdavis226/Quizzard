import { model, Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';

// USER INTERFACE
export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password: string;
  mana: number;
  mageMeter: number;
  friends: Types.ObjectId[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// USER SCHEMA
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

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err instanceof Error ? err : undefined);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default model<IUser>('User', UserSchema);
