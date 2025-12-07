// src/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'CLP' },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    categoryId: {type: String,
      enum: ['shawarma', 'kebab', 'falafel', 'ensaladas', 'bebidas', 'dulces'],
      default: 'shawarma',
    },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

export const Product = mongoose.model('Product', productSchema);
