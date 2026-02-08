import express from 'express';
import dotenv from 'dotenv';
import connectDb from './config/db.js';
import { createClient } from 'redis';
import userRoutes from './routes/user.js'
import { connectRabbitMq } from './config/rabbitmq.js';
import cors from 'cors'
dotenv.config();

const app = express();
const port = process.env.PORT || 6001;


app.use(express.json());

app.use(cors({
  origin:"*"
}));



export const redisClient = createClient({
    url:process.env.REDIS_URL!,
});


app.post("/debug", (req, res) => {
    console.log("BODY:", req.body);
    res.json({received:true});
});

app.use("/api/v1",  userRoutes);

    await connectRabbitMq();
    await connectDb();
    await redisClient.connect();
    console.log("connected to redis");

    app.listen(port, () => {
      console.log(`User service running on port ${port}`);
    });