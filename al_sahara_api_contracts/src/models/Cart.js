// src/models/Cart.js
import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true,},
  quantity: {type: Number, required: true, min: 1, default: 1,},
  unitPrice: {type: Number, required: false, default: 0, min: 0,},
});

const cartSchema = new mongoose.Schema(
  {
    cartId: {type: String, required: true, unique: true,},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null,},
    items: [cartItemSchema],
    subtotal: {type: Number, default: 0, min: 0,},
    deliveryFee: {type: Number, default: 0, min: 0,},
    tip: {type: Number, default: 0, min: 0,},
    total: {type: Number, default: 0, min: 0,},
  },
  { timestamps: true }
);

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
