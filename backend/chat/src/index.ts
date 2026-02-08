import express from 'express'
import dotenv from 'dotenv'
import connectDb from './config/db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 6003;

await connectDb();
app.listen(port , ()=>{
    console.log(`Chat service running on ${port}`)
})