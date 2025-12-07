// src/models/User.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    label: String,
    line1: String,
    commune: String,
    city: String,
    region: String,
    notes: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {type: String, required: true, unique: true, lowercase: true, trim: true,},
    passwordHash: { type: String, required: true },
    phone: { type: String, default: '' },
    role: {type: String, enum: ['customer', 'admin'], default: 'customer',},
    isActive: { type: Boolean, default: true },

 addresses: { type: [addressSchema], default: [] },

    preferences: {
      promoEmail: { type: Boolean, default: false },
      orderStatusSms: { type: Boolean, default: false },
      notificationsChannel: {type: String,
        enum: ['sms', 'email', null],
        default: null,},
    },

    resetToken: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
