// src/controllers/categoriesController.js
import { categorySchema } from '../utils/zodSchemas.js';
import { Category } from '../models/Category.js';

function categoryToPublic(doc) {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    id: obj._id?.toString?.() || obj.id,
    name: obj.name,
    slug: obj.slug,
    order: obj.order,
    active: obj.active,
    isActive: obj.active,
  };
}

// GET /categories
export async function listCategories(req, res, next) {
  try {
    // Solo activas, ordenadas por "order"
    const cats = await Category.find({ active: true })
      .sort({ order: 1 })
      .exec();

    res.json(cats.map(categoryToPublic));
  } catch (err) {
    next(err);
  }
}

// POST /categories  (admin)
export async function createCategory(req, res, next) {
  try {
    const data = categorySchema.parse(req.body);

    const doc = await Category.create({
      name: data.name,
      slug: data.slug,
      order: data.order ?? 99,
      active: true,
    });

    res.status(201).json(categoryToPublic(doc));
  } catch (e) {
    e.status = e.status || 400;
    next(e);
  }
}

// PATCH /categories/:id  (admin)
export async function updateCategory(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await Category.findById(id).exec();
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    const merged = {
      id: existing._id.toString(),
      name: existing.name,
      slug: existing.slug,
      order: existing.order,
      ...req.body,
    };

    const parsed = categorySchema.partial().parse(merged);

    if (parsed.name != null) existing.name = parsed.name;
    if (parsed.slug != null) existing.slug = parsed.slug;
    if (parsed.order != null) existing.order = parsed.order;

    await existing.save();

    res.json(categoryToPublic(existing));
  } catch (e) {
    e.status = e.status || 400;
    next(e);
  }
}

// DELETE /categories/:id  (admin)
export async function deleteCategory(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await Category.findById(id).exec();
    if (!existing) {
      return res.status(404).json({ error: 'Not found' });
    }

    existing.active = false;
    await existing.save();

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
