import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import { createClient } from 'redis';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;


export const redisClient = createClient({
    url:process.env.REDIS_URL!,
});

redisClient.connect().then(()=>console.log("connected to redis")). catch(console.error);

const startServer = async () => {
  try {
    await connectDb();

    app.listen(port, () => {
      console.log(`User service running on port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
