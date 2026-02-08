import express from 'express';
import { getAllUser, getUserByEmail, getUserById, loginUser, myProfile, updateName, verifyUser } from '../controllers/user.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();


router.post("/login" , loginUser);
router.post("/verify",verifyUser);
router.get("/me", isAuth , myProfile);
router.get("/getUserEmail", isAuth , getUserByEmail);
router.get("/user/:id" ,isAuth , getUserById);
router.get("/users",isAuth , getAllUser)
router.post("/update/user",isAuth , updateName)

export default router;