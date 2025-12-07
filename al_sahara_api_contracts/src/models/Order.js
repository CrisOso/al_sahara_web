// src/models/Order.js
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true, min: 1 },
    image:     { type: String, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    customerUserId:  { type: String, default: null },
    customerName:    { type: String, default: null },
    customerEmail:   { type: String, default: null },
    customerPhone:   { type: String, default: null },
    note:            { type: String, default: "" },

    items: {
      type: [orderItemSchema],
      default: [],
    },

    subtotal:    { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tip:         { type: Number, default: 0 },
    total:       { type: Number, required: true },

    deliveryMethod: {
      type: String,
      enum: ['delivery', 'pickup'],
      default: 'delivery',
    },
    address: { type: String, default: null },

    paymentMethod: {
      type: String,
      enum: ['card', 'cash'],
      default: 'card',
    },
    paymentInfo: {
      method: { type: String, default: 'transbank' },
      status: { type: String, default: 'pending' },
      raw:    { type: Object, default: null },
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'delivering', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export { Order };
