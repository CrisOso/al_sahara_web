// src/controllers/cartController.js
import Cart from '../models/Cart.js';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// helper: recalcular totales del carrito
function recalcCartTotals(cart) {
  if (!cart) return;

  const subtotal = (cart.items || []).reduce((acc, it) => {
    const price = Number(it.unitPrice) || 0;
    const qty   = Number(it.quantity) || 0;
    return acc + price * qty;
  }, 0);

  cart.subtotal   = subtotal;
  cart.deliveryFee = Number(cart.deliveryFee) || 0;
  cart.tip         = Number(cart.tip) || 0;
  cart.total       = cart.subtotal + cart.deliveryFee + cart.tip;
}

// helper: obtener o crear carrito para este usuario/sesión
async function getOrCreateCart(req, res) {
  const userId = req.user?.id || req.user?._id || null;

  // 1) Tomar cartId desde header o cookie
  const headerCartId = req.headers['x-cart-id'];
  let cookieCartId = (req.cookies || {}).cartId;

  let cartId = headerCartId || cookieCartId;

  // 2) Si no existe ninguno, generar uno nuevo y setear cookie
  if (!cartId) {
    cartId = uuidv4();
    if (res?.cookie) {
      res.cookie('cartId', cartId, {
        httpOnly: false,
        sameSite: 'lax',
      });
    }
  }

  // 3) Buscar carrito por cartId
  let cart = await Cart.findOne({ cartId }).exec();

  if (!cart) {
    cart = new Cart({
      cartId,
      userId: userId ? new mongoose.Types.ObjectId(userId) : null,
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      tip: 0,
      total: 0,
    });
    await cart.save();
  }

  return cart;
}


// GET /cart
export async function getCart(req, res) {
  try {
    const cart = await getOrCreateCart(req, res);
    recalcCartTotals(cart);
    await cart.save();
    return res.json(cart);
  } catch (err) {
    console.error('ERROR en getCart:', err);
    return res.status(500).json({ error: 'No se pudo obtener el carrito' });
  }
}

// POST /cart/items
export async function addToCart(req, res) {
  try {
    const cart = await getOrCreateCart(req, res);

    const { productId, quantity, unitPrice } = req.body || {};
    if (!productId) {
      return res.status(400).json({ error: 'Falta productId' });
    }

    const qty = Number(quantity) || 1;
    const price = Number(unitPrice) || 0;

    // buscamos si ya existe el item
    const existing = cart.items.find(
      (it) => it.productId.toString() === String(productId)
    );

    if (existing) {
      existing.quantity += qty;
      if (!Number.isNaN(price) && price > 0) {
        existing.unitPrice = price; // por si el precio viene actualizado
      }
    } else {
      cart.items.push({
        productId,
        quantity: qty,
        unitPrice: price,
      });
    }

    recalcCartTotals(cart);
    await cart.save();

    return res.json(cart);
  } catch (err) {
    console.error('ERROR en addToCart:', err);
    return res.status(500).json({ error: 'No se pudo agregar al carrito' });
  }
}

// PATCH /cart/items/:productId
export async function updateCartItem(req, res) {
  try {
    const cart = await getOrCreateCart(req, res);
    const { productId } = req.params;
    const { quantity } = req.body || {};

    const qty = Number(quantity);
    if (!productId || Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const item = cart.items.find(
      (it) => it.productId.toString() === String(productId)
    );
    if (!item) {
      return res.status(404).json({ error: 'Producto no está en el carrito' });
    }

    item.quantity = qty;

    recalcCartTotals(cart);
    await cart.save();

    return res.json(cart);
  } catch (err) {
    console.error('ERROR en updateCartItem:', err);
    return res
      .status(500)
      .json({ error: 'No se pudo actualizar el ítem del carrito' });
  }
}

// DELETE /cart/items/:productId
export async function removeCartItem(req, res) {
  try {
    const cart = await getOrCreateCart(req, res);
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Falta productId' });
    }

    cart.items = cart.items.filter(
      (it) => it.productId.toString() !== String(productId)
    );

    recalcCartTotals(cart);
    await cart.save();

    return res.json(cart);
  } catch (err) {
    console.error('ERROR en removeCartItem:', err);
    return res
      .status(500)
      .json({ error: 'No se pudo eliminar el ítem del carrito' });
  }
}

// Opcional: vaciar carrito completo
export async function clearCart(req, res) {
  try {
    const cart = await getOrCreateCart(req, res);
    cart.items = [];
    recalcCartTotals(cart);
    await cart.save();
    return res.json(cart);
  } catch (err) {
    console.error('ERROR en clearCart:', err);
    return res
      .status(500)
      .json({ error: 'No se pudo vaciar el carrito' });
  }
}
