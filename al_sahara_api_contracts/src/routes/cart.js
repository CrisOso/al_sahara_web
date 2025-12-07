// src/routes/cart.js
import { Router } from 'express';
import {getCart, addToCart, updateCartItem, removeCartItem, clearCart,} from '../controllers/cartController.js';
import authenticate from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart); // Obtener el carrito actual
router.post('/items', addToCart); // Agregar ítem al carrito
router.patch('/items/:productId', updateCartItem); // Actualizar cantidad de un ítem
router.delete('/items/:productId', removeCartItem); // Eliminar un ítem específico
router.delete('/items', clearCart); // Vaciar el carrito completo

export default router;
