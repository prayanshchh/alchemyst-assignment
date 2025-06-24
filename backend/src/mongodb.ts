import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URL = process.env.MONGO_URL!;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!client) {
    client = new MongoClient(MONGO_URL);
    await client.connect();
  }
  return client;
}

export async function getDb(): Promise<Db> {
  if (!db) {
    const mongoClient = await getMongoClient();
    db = mongoClient.db(); // Optionally pass db name here
  }
  return db;
} 