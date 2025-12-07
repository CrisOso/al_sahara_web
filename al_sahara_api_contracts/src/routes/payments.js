
import { Router } from 'express';
import { createIntent, retryIntent } from '../controllers/paymentsController.js';

const r = Router();
r.post('/intents', createIntent);
r.post('/intents/:id', retryIntent);
export default r;
