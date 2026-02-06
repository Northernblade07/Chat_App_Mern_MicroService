import mongoose from "mongoose";

const connectDb=async()=>{
    const url = process.env.MONGO_URI;
    if(!url){
        throw new Error("mongo uri is not present in env");
    }

    try {
        
        await mongoose.connect(url, {
            dbName:"ChatAppMicroservice"
        })

        console.log("connected to mongodb");
    } catch (error) {
        console.error("failed to connect to db",error);
        process.exit(1);
    }
}

export default connectDb;