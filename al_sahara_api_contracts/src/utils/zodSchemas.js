
import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  order: z.number().int().optional(),
});

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  currency: z.string().default('CLP'),
  image: z.string().optional(),
  categoryId: z.string(),
  active: z.boolean().default(true),
});

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  unitPrice: z.number().nonnegative().optional(),
});
