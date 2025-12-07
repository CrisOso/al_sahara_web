// src/routes/products.js
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {listProducts, getProductById, createProduct, updateProduct, deleteProduct,} from '../controllers/productsController.js';

const router = Router();

router.get('/', listProducts); // Público: solo activos; Admin: todos
router.get('/:id', getProductById); // Detalle de producto
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Solo admin puede modificar productos' });
  }
  next();}
// Crear / actualizar / eliminar (solo admin logueado)
router.post('/', requireAuth, requireAdmin, createProduct);
router.patch('/:id', requireAuth, requireAdmin, updateProduct);
router.delete('/:id', requireAuth, requireAdmin, deleteProduct);

export default router;
