// src/middleware/auth.js
import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No autenticado', code: 'UNAUTHORIZED' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev');
    // payload: { id, email, role, iat, exp }
    req.user = payload;
    next();
  } catch (e) {
    console.error('JWT error:', e);
    return res.status(401).json({ message: 'Token inválido', code: 'INVALID_TOKEN' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Requiere rol admin', code: 'FORBIDDEN' });
  }
  next();
}

export default requireAuth;
