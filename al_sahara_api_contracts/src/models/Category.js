// src/models/Category.js
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {type: String, required: true, trim: true, lowercase: true, unique: true,},
    order: { type: Number, default: 99 },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const Category = mongoose.model('Category', categorySchema);
