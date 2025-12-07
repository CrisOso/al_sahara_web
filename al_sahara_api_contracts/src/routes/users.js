// src/routes/users.js
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {getProfile, updateProfile, adminListUsers, adminUpdateUser, adminDeleteUser,} from '../controllers/usersController.js';

const r = Router();

// /me
r.get('/me', requireAuth, getProfile);
r.patch('/me', requireAuth, updateProfile);

// /users (admin)
r.get('/users', requireAuth, requireAdmin, adminListUsers);
r.patch('/users/:id', requireAuth, requireAdmin, adminUpdateUser);
r.delete('/users/:id', requireAuth, requireAdmin, adminDeleteUser);

export default r;
