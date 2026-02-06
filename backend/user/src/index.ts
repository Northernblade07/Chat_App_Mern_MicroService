import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

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
