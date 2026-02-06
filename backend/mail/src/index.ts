import express from 'express';
import dotenv from 'dotenv'

dotenv.config();
const app = express();


const port = process.env.PORT || 5001;
app.listen(port , ()=>{
    console.log(`mail service started on ${port}`)
})