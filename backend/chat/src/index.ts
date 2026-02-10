import express from 'express'
import dotenv from 'dotenv'
import connectDb from './config/db.js';
import chatRouter from './routes/chat.js'
import cors from 'cors'
dotenv.config();

const app = express();
const port = process.env.PORT||6005;

app.use(express.json());

app.use(cors())

app.get("/health", (req,res)=>{
    res.send("chat alive");
});

app.use("/api/v1",chatRouter)

const startServer = async () => {
    try {

        await connectDb();
        console.log("✅ DB connected");

        app.listen(port, () => {
            console.log(`✅ Chat service running on ${port}`);
        });

    } catch (error) {

        console.error("🔥 CHAT SERVICE FAILED TO START");
        console.error(error);

        process.exit(1);
    }
};

startServer();
