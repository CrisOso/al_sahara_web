// src/controllers/ordersController.js
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

export async function createOrder(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'Debes iniciar sesión');

    console.log('[createOrder] body.note:', req.body?.note);

    const cartId = req.headers['x-cart-id'];
    if (!cartId) throw new ApiError(400, 'Cart-ID requerido');

    const cart = await Cart.findOne({ cartId }).exec();
    if (!cart || !cart.items.length) {
      throw new ApiError(400, 'Carrito vacío');
    }

    // --- Traemos productos reales de la BD ---
    const productIds = cart.items.map(i => i.productId);
    const products = await Product.find({ _id: { $in: productIds } }).lean();

    const orderItems = [];
    let subtotal = 0;

    for (const item of cart.items) {
      const prod = products.find(p => String(p._id) === String(item.productId));

      const priceFromProduct =
        prod?.price ??
        prod?.valor ??
        prod?.unitPrice ??
        null;

      const price =
        priceFromProduct != null
          ? Number(priceFromProduct)
          : Number(item.unitPrice) || 0;

      const qty = item.quantity || 0;
      const sub = price * qty;

      orderItems.push({
        productId: prod?._id || item.productId,
        name: prod?.name || item.productName || '',
        price,
        quantity: qty,
        image: prod?.image,
      });

      subtotal += sub;
    }

    const {
      deliveryMethod,
      paymentMethod,
      address,
      customerName,
      customerEmail,
      customerPhone,
      customerUserId,
      deliveryFee: bodyDeliveryFee,
      tip: bodyTip,
      note,
    } = req.body || {};

    const deliveryFee = Number(bodyDeliveryFee) || 0;
    const tip         = Number(bodyTip) || 0;
    const total       = subtotal + deliveryFee + tip;
    
    const order = await Order.create({
      userId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tip,
      total,
      status: 'pending',
      deliveryMethod: deliveryMethod || 'pickup',
      paymentMethod:  paymentMethod  || 'card',
      address: address || null,
      customerName:  customerName  || req.user?.name  || null,
      customerEmail: customerEmail || req.user?.email || null,
      customerPhone: customerPhone || req.user?.phone || null,
      customerUserId: customerUserId || userId,
      note: note || "",
    });

    // Vaciar carrito
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    console.error('[createOrder] ERROR:', err);
    next(err);
  }
}

// GET /orders/mine (lista pedidos del usuario)
export async function listUserOrders(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'Debes iniciar sesión');

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).exec();
    res.json(orders);
  } catch (err) {
    next(err);
  }
}

// GET /orders/:id
export async function getOrderById(req, res, next) {
  try {
    const userId = req.user?.id;
    const role   = req.user?.role || 'customer';
    const id     = req.params.id;

    const order = await Order.findById(id).exec();
    if (!order) throw new ApiError(404, 'Orden no encontrada');

    const isOwner = order.userId.toString() === String(userId);
    const isAdmin = role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'No autorizado');
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}


// GET /orders (admin - lista todos los pedidos con filtros)
export async function listOrders(req, res) {
  try {
    const { status, from, to, email } = req.query;
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (email) {
      filter.customerEmail = { $regex: email, $options: 'i' };
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to)   filter.createdAt.$lte = new Date(to);
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .exec();

    res.json(orders);
  } catch (err) {
    console.error('[listOrders] error:', err);
    res.status(500).json({ error: 'Error al listar pedidos' });
  }
}


// PATCH /orders/:id/status (admin)
export async function updateOrderStatus(req, res) {
  try {
    const role = req.user?.role;
    if (role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin puede actualizar estado' });
    }

    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      'pending',
      'paid',
      'delivering',
      'completed',
      'failed',
      'cancelled',
      'refunded',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Estado no válido',
        allowed: allowedStatuses,
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).exec();

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    res.json(order);
  } catch (err) {
    console.error('[updateOrderStatus] error:', err);
    res.status(500).json({ error: 'Error al actualizar estado del pedido' });
  }
}
