// src/controllers/usersController.js
import { ApiError } from '../utils/ApiError.js';
import {
  getUsers,
  findUserById,
  userToPublic,
} from '../data/usersStore.js';

// ===============================
//  /me - Perfil del usuario logueado
// ===============================

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);

    if (!user || user.isActive === false) {
      throw new ApiError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
    }

    res.json(userToPublic(user));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await findUserById(userId);

    if (!user || user.isActive === false) {
      throw new ApiError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
    }

    const { name, phone, addresses, preferences } = req.body || {};

    if (typeof name === 'string') {
      user.name = name.trim();
    }

    if (typeof phone === 'string') {
      user.phone = phone.trim();
    }

    // Actualizar direcciones (máx 2: principal y secundaria)
    if (Array.isArray(addresses)) {
      user.addresses = addresses
        .filter((addr) => addr && typeof addr.line1 === 'string' && addr.line1.trim() !== '')
        .map((addr, index) => ({
          label: addr.label || (index === 0 ? 'Principal' : 'Secundaria'),
          line1: addr.line1.trim(),
          line2: addr.line2 || '',
          commune: addr.commune || '',
          city: addr.city || '',
          region: addr.region || '',
          notes: addr.notes || '',
        }));
    }

    // Actualizar preferencias
    if (preferences && typeof preferences === 'object') {
      user.preferences = {
        ...(user.preferences || {}),
        ...preferences,
      };
    }

    await user.save();

    res.json(userToPublic(user));
  } catch (err) {
    next(err);
  }
}

// ===============================
//  /users - Endpoints de administración
// ===============================

// GET /users?limit=100
export async function adminListUsers(req, res, next) {
  try {
    const allUsers = await getUsers();

    let items = allUsers;
    const limit = req.query.limit ? Number(req.query.limit) : null;
    if (limit && Number.isFinite(limit) && limit > 0) {
      items = allUsers.slice(0, limit);
    }

    res.json({
      items: items.map((u) => userToPublic(u)),
      total: allUsers.length,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /users/:id  (rol y activo)
export async function adminUpdateUser(req, res, next) {
  try {
    const id = req.params.id;
    const user = await findUserById(id);

    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
    }

    const { role, isActive } = req.body || {};

    if (typeof role === 'string') {
      const allowedRoles = ['customer', 'admin'];
      if (!allowedRoles.includes(role)) {
        throw new ApiError(400, 'Rol inválido', 'INVALID_ROLE');
      }
      user.role = role;
    }

    if (typeof isActive === 'boolean') {
      user.isActive = isActive;
    }

    await user.save();

    res.json(userToPublic(user));
  } catch (err) {
    next(err);
  }
}

// DELETE /users/:id  (desactivar)
export async function adminDeleteUser(req, res, next) {
  try {
    const id = req.params.id;
    const user = await findUserById(id);

    if (!user) {
      throw new ApiError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
    }

    await user.deleteOne();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
