// src/controllers/webpayController.js
import pkg from 'transbank-sdk';
import { Order } from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';

// Desestructuramos desde el default (CommonJS)
const { WebpayPlus, IntegrationApiKeys, Environment, Options } = pkg;

// Config sandbox por defecto
// Código de comercio de integración Webpay Plus (según docs Transbank)
const commerceCode =
  process.env.WEBPAY_COMMERCE_CODE || '597055555532';

// API key de integración
// En la v6 se usa IntegrationApiKeys.WEBPAY
const apiKey =
  process.env.WEBPAY_API_KEY || IntegrationApiKeys.WEBPAY;

// Entorno: Integration por defecto
const env =
  process.env.WEBPAY_ENV === 'production'
    ? Environment.Production
    : Environment.Integration;

const tx = new WebpayPlus.Transaction(
  new Options(commerceCode, apiKey, env)
);

// URL del front para volver después del pago
const FRONT_BASE_URL =
  process.env.FRONT_BASE_URL || 'http://localhost:3000';

/**
 * POST /webpay/pagar
 * body: { orderId, amount? }
 */
export async function pagarWebpay(req, res, next) {
  try {
    const { orderId, amount } = req.body || {};
    const userId = req.user?.id;

    if (!orderId) {
      throw new ApiError(400, 'orderId requerido');
    }

    const order = await Order.findById(orderId).exec();
    if (!order) {
      throw new ApiError(404, 'Orden no encontrada');
    }

    // Solo dueño de la orden o admin
    const isOwner = order.userId.toString() === String(userId);
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new ApiError(403, 'No autorizado para pagar esta orden');
    }

    // Monto: el que viene en body o el total de la orden
    const total = Number(amount || order.total || 0);
    if (!total || total <= 0) {
      throw new ApiError(400, 'Monto inválido para pago');
    }

    const buyOrder  = String(order._id);
    const sessionId = String(userId || order.customerUserId || 'anon');
    const returnUrl = `${FRONT_BASE_URL}/comprobante.html`;

    const resp = await tx.create(buyOrder, sessionId, total, returnUrl);

    // Guardamos info de pago pendiente en la orden
    order.paymentMethod = 'card';
    order.paymentInfo = {
      method: 'transbank',
      status: 'pending',
      raw: {
        token: resp.token,
        url: resp.url,
      },
    };
    await order.save();

    // Front espera { url, token }
    res.json({
      url: resp.url,
      token: resp.token,
    });
  } catch (err) {
    console.error('[pagarWebpay] ERROR:', err);
    next(err);
  }
}

/**
 * POST /webpay/confirm
 * body: { token }   (la recibe comprobante.html con token_ws)
 */
export async function confirmarWebpay(req, res, next) {
  try {
    const token = req.body?.token || req.body?.token_ws;
    if (!token) {
      throw new ApiError(400, 'token_ws requerido');
    }
    const result = await tx.commit(token);

    const buyOrder = result.buy_order;
    const status   = result.status; // "AUTHORIZED", "FAILED", etc.

    const order = await Order.findById(buyOrder).exec();
    if (!order) {
      throw new ApiError(404, 'Orden no encontrada para confirmar pago');
    }

    // Mapeamos estado Webpay a estado interno
    let newStatus = order.status;
    if (status === 'AUTHORIZED') {
      newStatus = 'paid';
    } else if (status === 'FAILED' || status === 'REVERSED') {
      newStatus = 'failed';
    }

    order.status = newStatus;
    order.paymentInfo = {
      method: 'transbank',
      status,
      raw: result,
    };
    await order.save();

    res.json({
      ok: true,
      orderId: order._id,
      status: newStatus,
      result,
    });
  } catch (err) {
    console.error('[confirmarWebpay] ERROR:', err);
    next(err);
  }
}
