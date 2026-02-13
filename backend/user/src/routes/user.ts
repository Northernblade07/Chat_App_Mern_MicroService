import express from 'express';
import { getAllUser, getUserByEmail, getUserById, loginUser, myProfile, updateName, verifyUser } from '../controllers/user.js';
import { isAuth } from '../middleware/isAuth.js';

const router = express.Router();


router.post("/login" , loginUser);
router.post("/verify",verifyUser);
router.get("/me", isAuth , myProfile);
router.post("/getUserEmail", isAuth , getUserByEmail);
router.get("/user/:id", getUserById);
router.get("/users/all",isAuth , getAllUser)
router.patch("/update/user",isAuth , updateName)

export default router;