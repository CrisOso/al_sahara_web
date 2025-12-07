import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadsController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const uploadDir = process.env.UPLOAD_DIR || './uploads';

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname.match(/\.[^.]+$/) || [''])[0];
    cb(
      null,
      `${Date.now()}_${Math.random().toString(36).slice(2, 6)}${ext}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const r = Router();
r.post('/images', requireAuth, requireAdmin, upload.single('file'), uploadImage);

export default r;
