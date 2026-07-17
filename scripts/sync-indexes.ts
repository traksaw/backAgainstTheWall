// Manual runbook script, run by hand (never in CI/postinstall) — see
// docs/migrations.md for when to run it and why not syncIndexes().
import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../lib/mongoose";
import QuizResultModel from "../models/QuizResult";
import UserModel from "../models/User";

const models = [QuizResultModel, UserModel];

async function main() {
  await connectDB();

  for (const model of models) {
    await model.createIndexes();
    console.log(`Synced indexes for ${model.modelName}`);
  }
}

main()
  .catch((err) => {
    console.error("Failed to sync indexes:", err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
