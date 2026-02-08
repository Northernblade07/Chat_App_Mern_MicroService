import express from 'express'
import isAuth from '../middleware/isAuth.js';
import { createNewChat } from '../controllers/Chat.js';

const router = express.Router();


router.post("/chat/new" , isAuth , createNewChat);

export default router