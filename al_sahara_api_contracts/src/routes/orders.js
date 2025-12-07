import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {createOrder, listUserOrders, getOrderById, listOrders, updateOrderStatus,} from '../controllers/ordersController.js';

const router = Router();

router.post('/', requireAuth, createOrder);
router.get('/mine', requireAuth, listUserOrders);
router.get('/', requireAuth, (req, res, next) => {
  const role = req.user?.role || 'customer';
  if (role === 'admin') {
    return listOrders(req, res, next);
  }
  return listUserOrders(req, res, next);
});

router.get('/:id', requireAuth, getOrderById);
router.patch('/:id/status', requireAuth, (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Solo admin puede cambiar estado del pedido' });
  }
  return updateOrderStatus(req, res, next);
});

export default router;
