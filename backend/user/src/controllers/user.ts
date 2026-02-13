import type { Response } from "express";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/tryCatch.js";
import { redisClient } from "../index.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { User } from "../model/User.js";

export const loginUser = TryCatch(
    async(req , res)=>{
                console.log("🔥 LOGIN CONTROLLER HIT");

        console.log(req.body)
        const {email} = req.body;

        console.log(email)
if(!email){
   console.log("EMAIL IS UNDEFINED");
   return res.status(400).json({message:"Email required"});
}

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
       await redisClient.set(otpKey, otp, {
   EX: 300
});
        await redisClient.set(rateLimitKey , "true" , {
           EX:60
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


export const verifyUser=TryCatch(async(req , res)=>{

    const {email , otp:enteredOtp} = req.body;

    if(!email||!enteredOtp){
        res.status(400).json({
            message:"Email and Otp is required"
        });

        return;
    }

    const otpKey = `otp:${email}`;

    const storedOtp = await redisClient.get(otpKey);
    if(!storedOtp || storedOtp!==enteredOtp){
        res.status(400).json({
            message:"Invalid Otp or Expired Otp"
        })
        return;
    }

    await redisClient.del(otpKey);

    let user = await User.findOne({email});

    if(!user){
        const name = email.split("@")[0];
        user = await User.create({
            name,
            email
        })
    }

    const token = generateToken(user);

    res.json({
   message:"User Verified",
   user:{
      id:user._id,
      email:user.email,
      name:user.name
   },
   token
})
});



export const myProfile=TryCatch(async(req:AuthenticatedRequest , res:Response)=>{
        const user = req.user;

        res.json(user);
})  


export const updateName=TryCatch(async(req:AuthenticatedRequest, res:Response)=>{

    const user = await User.findById(req.user?._id);
    if(!user){
        res.status(404).json({
            message:"Please login"
        })
        return;
    }

    const {name} = req.body;
     user.name = name;
     await user.save();

     const token = generateToken(user);

     res.json({
   message:"User updated",
   user:{
      id:user._id,
      email:user.email,
      name:user.name
   },
   token
})
})

// get specific user
export const getUserByEmail = TryCatch(async(req:AuthenticatedRequest , res:Response)=>{
    const {email} = req.body;
    if(!email){
        res.status(404).json({
            message:"Email not found"
        })
        return;
    }

    const user = await User.findOne({email});
    if(!user){
        res.status(404).json({
            message:"No User found"
        })
        return;
    }

    res.json(user);
})

// get all users (excluding logged in user)
export const getAllUser = TryCatch(async (req: AuthenticatedRequest, res: Response) => {

    const loggedInUserId = req.user?._id;

    if (!loggedInUserId) {
        res.status(401).json({
            message: "Unauthorized"
        });
        return;
    }

    const users = await User.find({
        _id: { $ne: loggedInUserId } 
    }).select("_id name email").lean();

    res.json(users);
});

export const getUserById = TryCatch(async(req , res)=>{
    const user =await User.findById(req.params.id);

    if(!user){
        res.status(404).json({
            message:"User not found"
        })
        return;
    }

    res.json(user);
})