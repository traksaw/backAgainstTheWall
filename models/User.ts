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
  passwordChangedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    // WAS-19: schema-level backstop for AuthService's normalizeEmail() - keeps
    // the unique index case/whitespace-insensitive even if some other write
    // path ever bypasses lib/auth.ts.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // WAS-11: select:false is the schema-level backstop - a plain find()/
    // findOne() can no longer return the hash by accident. Callers that
    // legitimately need it (signIn) must opt back in with .select('+passwordHash').
    passwordHash: { type: String, required: true, select: false },
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
    // WAS-11 follow-up: same select:false backstop as passwordHash. Every
    // read path (resetPassword/verifyEmail) only filters on these fields
    // and never reads the value back off the returned document, so unlike
    // signIn, nothing needs to opt back in with .select('+...').
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires: Date,
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: Date,
    // WAS-88: unlike the token-hash fields above, this isn't a secret - it's
    // read on every authenticated request (lib/jwt.ts getUserIdFromRequest)
    // to invalidate JWTs issued before the last password reset, so it stays
    // selected by default rather than requiring every caller to opt back in.
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    // WAS-11 follow-up: second layer behind select:false. If a future code
    // path re-selects one of these secrets (the way signIn legitimately
    // does for passwordHash) and then serializes the document straight to
    // a client - e.g. NextResponse.json(user) - this still strips them.
    // Doesn't apply to .lean() results, which are plain objects with no
    // toJSON of their own.
    toJSON: {
      transform(_doc, ret) {
        Reflect.deleteProperty(ret, "passwordHash")
        Reflect.deleteProperty(ret, "resetPasswordTokenHash")
        Reflect.deleteProperty(ret, "emailVerificationTokenHash")
        return ret
      },
    },
  }
)

const UserModel: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

export default UserModel