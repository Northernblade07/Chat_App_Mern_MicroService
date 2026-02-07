import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/tryCatch.js";
import { redisClient } from "../index.js";

export const loginUser = TryCatch(
    async(req , res)=>{
        const {email , password} = req.body;

        const rateLimitKey = `otp:ratelimit:${email}`
        const ratelimit = await redisClient.get(rateLimitKey)

        if(ratelimit){
            res.status(429).json({
                message:"Too many request. Please wait before requesting new otp",
            })

            return;
        }

        const otp = Math.floor(100000+Math.random()*900000).toString();

        const otpKey = `otp:${email}`
        await redisClient.set(otpKey , otp ,{
            expiration:{
                type:"EX",
                value:300
            }
        })

        await redisClient.set(rateLimitKey , "true" , {
            expiration:{
                type:'EX',
                value:60
            }
        })

        const message ={
            to:email,
            subject:"Your otp code",
            body:`Your otp is ${otp}. It is valid for 5 minutes`
        }

        await publishToQueue("send-otp" ,message);

        res.status(200).json({
            message:"OTP sent to your email"
        })
    }
)