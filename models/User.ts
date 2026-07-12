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
  emailVerified: boolean
  resetPasswordTokenHash?: string
  resetPasswordExpires?: Date
  emailVerificationTokenHash?: string
  emailVerificationExpires?: Date
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
    // WAS-32: emailVerified is display-only for now - no route currently
    // gates on it. The four token fields below store only a SHA-256 hash
    // of the token that was emailed (see lib/tokens.ts), never the raw
    // token, plus an expiry. Both pairs are cleared on successful use,
    // which is what makes the token single-use.
    emailVerified: { type: Boolean, default: false },
    resetPasswordTokenHash: String,
    resetPasswordExpires: Date,
    emailVerificationTokenHash: String,
    emailVerificationExpires: Date,
  },
  { timestamps: true }
)

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default UserModel