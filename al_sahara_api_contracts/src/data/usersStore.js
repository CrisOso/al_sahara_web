// src/data/usersStore.js
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

let adminSeeded = false;

/**
 * Crea el usuario admin por defecto si aún no existe.
 * Usa las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD si están definidas.
 */
async function ensureAdminSeeded() {
  if (adminSeeded) return;

  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@al-sahara.cl');
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = await User.findOne({ email }).exec();
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);

    await User.create({
      name: 'Administrador',
      email,
      passwordHash,
      role: 'admin',
      phone: '',
      isActive: true,
      addresses: [],
      preferences: {},
    });
  }

  adminSeeded = true;
}

/**
 * Devuelve todos los usuarios.
 */
export async function getUsers() {
  await ensureAdminSeeded();
  return User.find({}).exec();
}

/**
 * Busca un usuario por ID.
 */
export async function findUserById(id) {
  await ensureAdminSeeded();
  if (!id) return null;
  return User.findById(id).exec();
}

/**
 * Busca un usuario por email (normalizado).
 */
export async function findUserByEmail(email) {
  await ensureAdminSeeded();
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  return User.findOne({ email: normalized }).exec();
}

/**
 * Busca usuario por token de reseteo válido.
 */
export async function findUserByResetToken(token) {
  await ensureAdminSeeded();
  if (!token) return null;
  const now = new Date();
  return User.findOne({
    resetToken: token,
    resetTokenExpiresAt: { $gt: now },
  }).exec();
}

/**
 * Crea un nuevo usuario (cliente por defecto).
 * Lanza error si falta info o el email ya existe.
 */
export async function createUser({ name, email, password, phone, role = 'customer' }) {
  await ensureAdminSeeded();

  if (!name || !email || !password) {
    const err = new Error('Nombre, email y contraseña son obligatorios');
    err.code = 'VALIDATION_ERROR';
    err.status = 400;
    throw err;
  }

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail }).exec();
  if (existing) {
    const err = new Error('El email ya está registrado');
    err.code = 'EMAIL_IN_USE';
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    phone: phone || '',
    role,
    isActive: true,
    addresses: [],
    preferences: {},
  });

  return user;
}

/**
 * Valida credenciales de login.
 * Devuelve el usuario o null.
 */
export async function validateCredentials(email, password) {
  await ensureAdminSeeded();

  const normalized = normalizeEmail(email);
  const user = await User.findOne({
    email: normalized,
    isActive: true,
  }).exec();

  if (!user) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return user;
}

/**
 * Convierte un usuario interno en un objeto público seguro (sin passwordHash).
 */
export function userToPublic(user) {
  if (!user) return null;

  const obj =
    typeof user.toObject === 'function' ? user.toObject() : { ...user };

  return {
    id: obj._id?.toString?.() || obj.id,
    name: obj.name,
    email: obj.email,
    phone: obj.phone || '',
    role: obj.role,
    isActive: obj.isActive,
    addresses: obj.addresses || [],
    preferences: obj.preferences || {},
  };
}
