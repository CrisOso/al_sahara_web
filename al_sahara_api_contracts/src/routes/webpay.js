// src/routes/webpay.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  pagarWebpay,
  confirmarWebpay,
} from '../controllers/webpayController.js';

const router = Router();

router.post('/pagar', requireAuth, pagarWebpay);

router.post('/confirm', requireAuth, confirmarWebpay);

export default router;
