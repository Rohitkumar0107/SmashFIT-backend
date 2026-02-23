import express , { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { verifyAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(express.json()); 


//for register
router.post('/register', AuthController.register);

// for login 
router.post('/login', AuthController.login);

//for logout
router.post('/logout',verifyAuth, AuthController.logout);

//for refersh token
router.post('/refresh', AuthController.refreshToken);

//for google login
router.post('/google', AuthController.googleAuth);

export default router;