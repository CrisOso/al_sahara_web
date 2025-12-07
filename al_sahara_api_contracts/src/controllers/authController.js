// src/controllers/authController.js
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';
import {
  createUser,
  validateCredentials,
  findUserByEmail,
  findUserByResetToken,
  userToPublic,
} from '../data/usersStore.js';

function generateToken(user) {
  const id =
    user.id ||
    (user._id && user._id.toString && user._id.toString()) ||
    undefined;

  const payload = {
    id,
    email: user.email,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET || 'dev';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

// LOGIN
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      throw new ApiError(
        400,
        'Email y contraseña son obligatorios',
        'VALIDATION_ERROR'
      );
    }

    const user = await validateCredentials(email, password);
    if (!user) {
      throw new ApiError(401, 'Credenciales inválidas', 'INVALID_CREDENTIALS');
    }

    const token = generateToken(user);

    res.json({
      token,
      user: userToPublic(user),
    });
  } catch (err) {
    next(err);
  }
}

// REGISTRO
export async function register(req, res, next) {
  try {
    const { name, email, password, phone } = req.body || {};

    const user = await createUser({
      name,
      email,
      password,
      phone,
      role: 'customer',
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: userToPublic(user),
    });
  } catch (err) {
    next(err);
  }
}

// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
export async function recoverPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) {
      throw new ApiError(400, 'Email es obligatorio', 'VALIDATION_ERROR');
    }

    const user = await findUserByEmail(email);
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      user.resetToken = token;
      user.resetTokenExpiresAt = expiresAt;
      await user.save();
    }

    res.json({
      message:
        'Si el correo existe, se ha enviado un email de recuperación.',
    });
  } catch (err) {
    next(err);
  }
}

// RESETEAR CONTRASEÑA USANDO TOKEN
export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      throw new ApiError(
        400,
        'Token y nueva contraseña son obligatorios',
        'VALIDATION_ERROR'
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new ApiError(
        400,
        'La nueva contraseña debe tener al menos 6 caracteres',
        'VALIDATION_ERROR'
      );
    }

    const user = await findUserByResetToken(token);
    if (!user) {
      throw new ApiError(
        400,
        'Token inválido o expirado',
        'INVALID_RESET_TOKEN'
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    user.resetToken = null;
    user.resetTokenExpiresAt = null;
    await user.save();

    const jwtToken = generateToken(user);

    res.json({
      message: 'Contraseña actualizada correctamente.',
      token: jwtToken,
      user: userToPublic(user),
    });
  } catch (err) {
    next(err);
  }
}
