import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const cached: MongooseCache = (global as any).mongoose || {
  conn: null,
  promise: null,
};

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI!)
      .then(async (mongooseInstance) => {
        // Wait for the connection to be fully ready, not just "connecting"
        if (mongooseInstance.connection.readyState !== 1) {
          await new Promise<void>((resolve, reject) => {
            mongooseInstance.connection.once("connected", () => resolve());
            mongooseInstance.connection.once("error", (err) => reject(err));
          });
        }
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  (global as any).mongoose = cached;
  return cached.conn;
}

export async function getMongoDB() {
  await connectDB();

  if (!mongoose.connection.db) {
    throw new Error("MongoDB not connected");
  }
  return mongoose.connection.db;
}

export async function getMongoClient() {
  await connectDB();
  return mongoose.connection.getClient();
}
