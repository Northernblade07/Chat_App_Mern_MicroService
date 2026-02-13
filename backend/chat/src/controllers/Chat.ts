import type { Response } from "express";
import TryCatch from "../config/tryCatch.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";
import { Chat } from "../models/Chat.js";
import { Messages } from "../models/Messages.js";
import axios from "axios";
import { getRecieverSocketId, io } from "../config/socket.js";

export const createNewChat = TryCatch(async(req:AuthenticatedRequest , res:Response)=>{
    const userId = req.user?._id;
    const {otherUserId} = req.body;
    if(!otherUserId){
        res.status(400).json({
            message:"other userId is required"
        })
        return;
    }

    const existingChat = await Chat.findOne({
        users:{
            $all:[userId , otherUserId],
            $size:2
        }
    })

    if(existingChat){
        res.json({
            message:"Chat already exists",
            chatId:existingChat._id,
        });
        return;
    }

    const newChat = await Chat.create({
        users:[userId , otherUserId],
    });

    res.status(201).json({
        message:"new chat created",
        chatId:newChat._id,
    })
})


export const getAllChats = TryCatch(async(req:AuthenticatedRequest ,res:Response)=>{
    const userId = req.user?._id;
    if(!userId){
        res.status(400).json({
            message:"UserId is missing"
        });
        return;
    }   

    const chats = await Chat.find({
        users:userId
    }).sort({updatedAt:-1});

    const chatWithUserData = await Promise.all(
        chats.map(async(chat)=>{
            const otherUserId = chat.users.find(id=>id !==userId);

            const unseenCount = await Messages.countDocuments({
                chatId:chat._id,
                sender:{$ne:userId},
                seen:false,
            });

            try {
                const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

                return {
                    user:data,
                    chat:{
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage||null,
                        unseenCount,
                    }
                }
            } catch (error) {
                console.log(error)
                return{
                    user:{
                        _id:otherUserId,
                        name:"unknown user"
                    },
                    chat:{
                        ...chat.toObject(),
                        latestMessage: chat.latestMessage||null,
                        unseenCount,
                    }
                }
            }
        })
    );

    res.json({
        chats:chatWithUserData,
    })
})


export const sendMessage = TryCatch(async(req:AuthenticatedRequest , res:Response)=>{
    const senderId = req.user?._id;

    const{chatId , text} = req.body;

    const imageFile = req.file;

    if (!senderId) {
        res.status(401).json({
            message:"Unauthorised access"
        })
        return;
    }

    if(!chatId){
        res.status(400).json({
            message:"chatId is required"
        })
        return;
    }

    if(!text && !imageFile){
        res.status(400).json({
            message:"Either text or image is required"
        })
        return;
    }

    const chat = await Chat.findById(chatId)

    if(!chat){
        res.status(404).json({
            message:"Chat not found"
        });
        return;
    }

    const isUserInChat = chat.users.some(
        (userid)=>userid.toString() === senderId.toString()
    );

    if(!isUserInChat){
        res.status(403).json({
            message:"You are not a participant in this chat"
        });
        return;
    }

    const otherUserId = chat.users.find(
    (userId)=>userId.toString() !== senderId.toString()
    );

    if(!otherUserId){
        res.status(401).json({
            message:"No other user"
        })
        return;
    }

    // socker setup
    const recieverSocketId = getRecieverSocketId(otherUserId.toString())
    let isRecieverInChatRoom=false;
    if(recieverSocketId){
        const recieverScoket = io.sockets.sockets.get(recieverSocketId)
        if(recieverScoket && recieverScoket.rooms.has(chatId)){
            isRecieverInChatRoom= true;
        }
    }


    let messageData:any={
        chatId:chatId,
        sender:senderId,
        seen:isRecieverInChatRoom,
        seenAt:isRecieverInChatRoom?new Date():undefined,
    };

    if(imageFile){
        messageData.image = {
            url:imageFile.path,
            publicId:imageFile.filename,
        };
        messageData.messageType = "image";
        messageData.text = text || "";
    }else{
        messageData.text = text;
        messageData.messageType = "text";
    }

    const message = new Messages(messageData);

    const savedMessage = await message.save();

    const latestMessageText = imageFile?"Image":text;

    await Chat.findByIdAndUpdate(chatId,{
        latestMessage:{
            text:latestMessageText,
            sender:senderId,
        },
        updatedAt:new Date(),
    },{
        new:true
    })


    //  emit to sockets
    io.to(chatId).emit("newMessage",savedMessage);

    if(recieverSocketId){
        io.to(recieverSocketId).emit("newMessage",savedMessage);
    }

    const senderSocketId = getRecieverSocketId(senderId.toString())

    // if(senderSocketId){
    //     io.to(senderSocketId).emit("newMessage",savedMessage)
    // }
    if(isRecieverInChatRoom && senderSocketId){
        io.to(senderSocketId).emit("messageSeen",{
            chatId:chatId,
            seenBy:otherUserId,
            messageIds:[savedMessage._id]
        })
    }

    res.status(201).json({
        message:savedMessage,
        sender:senderId,
    })
})


export const getMessagesByChat=TryCatch(async(req:AuthenticatedRequest,res:Response)=>{

    const userId = req.user?._id;
    const {chatId} = req.params;

    if(!chatId){
        res.status(400).json({
            message:"ChatId required",
        })
        return;
    }

    if(!userId){
        res.status(400).json({
            message:"Unauthorised access"
        })
        return;
    }

    const chat = await Chat.findById(chatId);

    if(!chat){
        res.status(404).json({
            message:"chat not fount"
        });
        return;
    }

    const isUserInChat = chat.users.some(
        (id)=>id.toString()===userId.toString()
    )

    if(!isUserInChat){
        res.status(403).json({
            message:"you are not a participant in this chat"
        })
        return;
    }

    const messagesToMarkSeen = await Messages.find({
        chatId: chatId,
        sender:{$ne:userId},
        seen:false
    })
     await Messages.updateMany({
        chatId:chatId,
        sender:{$ne:userId},
        seen:false,
     },{
        seen:true,
        seenAt:new Date(),
     });

     const messages = await Messages.find({
        chatId
     }).sort({createdAt:1});

     const otherUserId = chat.users.find(
        (id)=>id!==userId
     );

     try {
        const {data} = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

        if(!otherUserId){
            res.status(400).json({
                message:"no other user in chat"
            })
            return;
        }

        // socket work

        if(messagesToMarkSeen.length>0){
            const otherUserSocketId = getRecieverSocketId(otherUserId.toString());
            if(otherUserSocketId){
                io.to(otherUserSocketId).emit("messageSeen",{
                    chatId:chatId,
                    seenBy:userId,
                    messageIds:messagesToMarkSeen.map((msg)=>msg._id)
                });
            }
        }

        res.json({
            messages,
            user:data,
        });

     } catch (error) {
        console.log("failed in finding user info for messages",error);
        res.json({
            messages,
            user:{_id:otherUserId , name:"Unknown User"}
        });
     }
})

export const updateMessage= TryCatch(async(req:AuthenticatedRequest,res:Response)=>{
    const UserId = req.user?._id;
    const {id} = req.params;
    const {text} = req.body;
    
    const message = await Messages.findById(id);
     
    if(!message){
        res.status(404).json({
            message:"message not found",
        })
        return;
    }

    if(message.sender!==UserId){
        res.status(401).json({
            message:"you are not allowed to update the message",
        })
        return;
    }

    message.text = text;
    await message.save();
    res.json({message})

})


export const deleteMessage = TryCatch(async(req:AuthenticatedRequest , res:Response)=>{
    const userId = req.user?._id

    const {id} = req.params;

    const message = await Messages.findById(id);

    if(!message){
        res.status(404).json({
            message:"message not found"
        });
        return;
    }

    if(message.sender !== userId){
        res.status(403).json({
            message:"Not allowed"
        });
        return;
    }

    await message.deleteOne();
    res.json({success:true});
})