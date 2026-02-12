import express from 'express'
import isAuth from '../middleware/isAuth.js';
import { createNewChat, deleteMessage, getAllChats, getMessagesByChat, sendMessage, updateMessage } from '../controllers/Chat.js';
import { upload } from '../config/multer.js';

const router = express.Router();


router.post("/chat/new" , isAuth , createNewChat);
router.get("/chat/all",isAuth, getAllChats);
router.post("/message",isAuth ,upload.single('image') ,sendMessage)
router.get("/message/:chatId",isAuth,getMessagesByChat)
router.put("/message/:id", isAuth, updateMessage);
router.delete("/message/:id", isAuth, deleteMessage)


export default router