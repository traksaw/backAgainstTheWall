import { Schema, Document, Model } from "mongoose"
import mongoose from "mongoose"

export interface IUser extends Document {
  _id: string // ✅ This is what Mongoose actually provides
  email: string
  passwordHash: string
  first_name?: string
  last_name?: string
  zip_code?: string
  occupation_status?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    // WAS-19: schema-level backstop for AuthService's normalizeEmail() - keeps
    // the unique index case/whitespace-insensitive even if some other write
    // path ever bypasses lib/auth.ts.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    first_name: String,
    last_name: String,
    zip_code: String,
    occupation_status: String,
  },
  { timestamps: true }
)

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default UserModel