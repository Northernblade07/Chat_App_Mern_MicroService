import express from 'express'
import dotenv from 'dotenv'
import connectDb from './config/db.js';
import chatRouter from './routes/chat.js'
dotenv.config();

const app = express();
const port = process.env.PORT || 6003;

app.use("/api/v1",chatRouter)

await connectDb();
app.listen(port , ()=>{
    console.log(`Chat service running on ${port}`)
})