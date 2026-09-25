import mongoose from "mongoose";

import { Env } from "./env.config";
import { logger } from "../utils/logger";

mongoose.set("sanitizeFilter", true);

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(Env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  logger.info("Connected to MongoDB", { database: mongoose.connection.name });
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info("Disconnected from MongoDB");
};
