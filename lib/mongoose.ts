import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

console.log("✅ Loaded MONGODB_URI:", process.env.MONGODB_URI)


if (!MONGODB_URI) {
  throw new Error("⚠️ MONGODB_URI environment variable is not defined")
}

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection
  }

  return mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
  })
}

export default mongoose // ✅ Add this line so you can import mongoose from here
