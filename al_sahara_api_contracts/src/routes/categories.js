
import { Router } from 'express';
import { listCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoriesController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const r = Router();
r.get('/', listCategories);
r.post('/', requireAuth, requireAdmin, createCategory);
r.patch('/:id', requireAuth, requireAdmin, updateCategory);
r.delete('/:id', requireAuth, requireAdmin, deleteCategory);
export default r;
