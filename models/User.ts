import { Schema, Document, Model } from "mongoose"
import mongoose from "@/lib/mongoose" // ✅ Import your shared instance

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
    email: { type: String, required: true, unique: true },
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