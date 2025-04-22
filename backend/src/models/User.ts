import { model, Schema, Document, Types, Model, CallbackError } from 'mongoose';
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

// Define a custom model interface to include the static methods
// (This allows us to use the static methods on the model itself)
export interface IUserModel extends Model<IUser> {
  findByUsername(username: string): Promise<IUser | null>;
  findByIdOrThrow(id: string): Promise<IUser>;
  findByUsernameOrThrow(username: string): Promise<IUser>;
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

// Add a pre-save hook to hash the password (if the password is modified/new)
UserSchema.pre('save', async function (next: (err?: CallbackError) => void) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as CallbackError);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Find a user by username
UserSchema.statics.findByUsername = async function (
  username: string
): Promise<IUser | null> {
  return this.findOne({ username });
};

// Find a user by ID (throw an error if not found)
UserSchema.statics.findByIdOrThrow = async function (
  id: string
): Promise<IUser> {
  const user = await this.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

// Find a user by username (throw an error if not found)
UserSchema.statics.findByUsernameOrThrow = async function (
  username: string
): Promise<IUser> {
  const user = await this.findOne({ username });
  if (!user) {
    throw new Error('Friend not found');
  }
  return user;
};

export default model<IUser, IUserModel>('User', UserSchema);
