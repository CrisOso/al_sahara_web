// src/routes/auth.js
import { Router } from 'express';
import {login,register,recoverPassword,resetPassword,} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/recover', recoverPassword);
router.post('/reset-password', resetPassword);

export default router;
