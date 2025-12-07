
const intents = new Map(); // id -> intent
let pseq = 1;

export function createIntent(req, res) {
  const id = `pi_${String(pseq++).padStart(6,'0')}`;
  const intent = {
    id,
    orderId: req.body.orderId,
    status: 'requires_payment_method',
    amount: Number(req.body.amount || 0),
    currency: req.body.currency || 'CLP',
    lastError: null,
    attempts: 0,
    method: req.body.method || 'card',
  };
  intents.set(id, intent);
  res.status(201).json(intent);
}

export function retryIntent(req, res) {
  const i = intents.get(req.params.id);
  if (!i) return res.status(404).json({ error:'Not found' });
  i.attempts += 1;
  // Simulación: 1er intento falla, 2do o más puede pasar
  if (i.attempts === 1) {
    i.status = 'failed';
    i.lastError = 'Tarjeta rechazada por emisor (simulado)';
  } else if (i.attempts < 4) {
    i.status = 'processing';
    i.lastError = null;
  } else {
    i.status = 'succeeded';
    i.lastError = null;
  }
  res.json(i);
}
