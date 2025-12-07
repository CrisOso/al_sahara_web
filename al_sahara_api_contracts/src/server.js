// src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';

import health from './routes/health.js';
import auth from './routes/auth.js';
import usersRoutes from './routes/users.js';
import products from './routes/products.js';
import categories from './routes/categories.js';
import cartRoutes from './routes/cart.js';
import orders from './routes/orders.js';
import payments from './routes/payments.js';
import uploads from './routes/uploads.js';
import errorHandler from './middleware/error.js';
import { connectMongo } from './db/mongo.js';
import webpayRouter from './routes/webpay.js';

dotenv.config();

const app = express();

app.use(helmet({crossOriginResourcePolicy: { policy: 'cross-origin' },}));
app.use(cors({origin: process.env.CORS_ORIGIN?.split(',') || '*', credentials: true, exposedHeaders: ['X-Cart-Id'],}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Swagger docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openapiPath = path.resolve(__dirname, '../openapi.yaml');
const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

let openapiDoc = {};
try {
  const file = fs.readFileSync(openapiPath, 'utf8');
  openapiDoc = YAML.parse(file);
} catch (err) {
  console.error('No se pudo leer openapi.yaml:', err);
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));


// Rutas
app.use('/health', health);
app.use('/auth', auth);
app.use('/', usersRoutes); // /me y /users
app.use('/products', products);
app.use('/categories', categories);
app.use('/cart', cartRoutes);
app.use('/orders', orders);
app.use('/payments', payments);
app.use('/uploads', uploads);
app.use('/webpay', webpayRouter);
app.use('/images', express.static(uploadDir));

// Manejo de errores
app.use(errorHandler);

async function startServer() {
  try {
    await connectMongo();
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`Al-Sahara API running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

startServer();
