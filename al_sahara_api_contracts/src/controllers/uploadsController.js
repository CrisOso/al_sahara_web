import path from 'path';

export function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }

    const filename = req.file.filename;
    // La ruta pública donde sirves las imágenes (ver punto 3)
    const url = `/images/${filename}`;

    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
}
