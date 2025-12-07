// src/db/mongo.js
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/al_sahara';

export async function connectMongo() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;

  try {
    await mongoose.connect(uri);
    console.log('[MongoDB] Conectado a:', uri);
  } catch (err) {
    console.error('[MongoDB] Error de conexión:', err.message);
    throw err;
  }
}
