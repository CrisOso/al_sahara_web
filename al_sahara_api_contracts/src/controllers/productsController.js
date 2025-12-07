// src/controllers/productsController.js
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

// ===============================
// GET /products
//  - Público: solo activos
//  - Admin: si ?scope=admin → todos
// ===============================
export async function listProducts(req, res, next) {
  try {
    const { scope } = req.query || {};

    const filter = {};
    if (scope !== 'admin') {
      // modo catálogo público → solo activos
      filter.active = true;
    }

    const products = await Product.find(filter).exec();
    res.json(products);
  } catch (err) {
    next(err);
  }
}

// ===============================
// GET /products/:id
// ===============================
export async function getProductById(req, res, next) {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).exec();
    if (!product) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    res.json(product);
  } catch (err) {
    next(err);
  }
}

// ===============================
// POST /products  (crear producto)
// ===============================
export async function createProduct(req, res, next) {
  try {
    const {
      name,
      price,
      categoryId,
      description,
      image,
      active,
      stock,
      lowStockThreshold, // por si más adelante agregas esto al schema
    } = req.body || {};

    if (!name || price == null) {
      throw new ApiError(400, 'Nombre y precio son obligatorios');
    }

    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      throw new ApiError(400, 'Precio inválido');
    }

    const parsedStock =
      stock == null ? 0 : Number(stock);
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      throw new ApiError(400, 'Stock inválido');
    }

    const product = await Product.create({
      name: name.trim(),
      price: parsedPrice,
      categoryId: categoryId || null,      // aquí se guarda la categoría
      description: description || '',
      image: image || '',
      active: typeof active === 'boolean' ? active : true,
      stock: parsedStock,
      // si tu schema no tiene lowStockThreshold, mongoose lo ignorará
      lowStockThreshold: lowStockThreshold ?? 0,
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
}

// ===============================
// PATCH /products/:id  (actualizar producto)
// ===============================
export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const {
      name,
      price,
      categoryId,
      description,
      image,
      active,
      stock,
      lowStockThreshold,
    } = req.body || {};

    const product = await Product.findById(id).exec();
    if (!product) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    if (typeof name === 'string') {
      product.name = name.trim();
    }

    if (price != null) {
      const parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        throw new ApiError(400, 'Precio inválido');
      }
      product.price = parsedPrice;
    }

    // aquí estaba el bug: body.categoryId → usamos directamente categoryId
    if (categoryId !== undefined) {
      product.categoryId = categoryId || null;
    }

    if (typeof description === 'string') {
      product.description = description;
    }

    if (typeof image === 'string') {
      product.image = image;
    }

    if (typeof active === 'boolean') {
      product.active = active;
    }

    if (stock != null) {
      const parsedStock = Number(stock);
      if (!Number.isFinite(parsedStock) || parsedStock < 0) {
        throw new ApiError(400, 'Stock inválido');
      }
      product.stock = parsedStock;
    }

    if (lowStockThreshold != null) {
      const parsedThreshold = Number(lowStockThreshold);
      if (Number.isFinite(parsedThreshold) && parsedThreshold >= 0) {
        product.lowStockThreshold = parsedThreshold;
      }
    }

    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
}

// ===============================
// DELETE /products/:id  (eliminar producto)
// ===============================
export async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    const deleted = await Product.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new ApiError(404, 'Producto no encontrado');
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
