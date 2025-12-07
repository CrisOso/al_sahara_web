// src/middleware/error.js
export default function errorHandler(err, req, res, next) {
  console.error('ERROR:', err);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    message: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
  });
}
