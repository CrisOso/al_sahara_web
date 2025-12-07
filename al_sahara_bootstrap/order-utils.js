// order-utils.js
(function () {
  const root = window.AlSaharaUI || (window.AlSaharaUI = {});

  // Formato CLP 
  function formatCLP(n) {
    const num = Number(n) || 0;
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(num);
  }

  // Mapeos de estado / métodos 
  function mapOrderStatus(status) {
    const map = {
      pending:   { label: 'Pendiente',   cls: 'text-bg-warning' },
      paid:      { label: 'Pagado',      cls: 'text-bg-success' },
      delivering:{ label: 'En reparto',  cls: 'text-bg-info' },
      completed: { label: 'Completado',  cls: 'text-bg-success' },
      cancelled: { label: 'Cancelado',   cls: 'text-bg-secondary' },
      failed:    { label: 'Fallido',     cls: 'text-bg-danger' },
      refunded:  { label: 'Reembolsado', cls: 'text-bg-secondary' },
    };
    return map[status] || { label: status || 'Desconocido', cls: 'text-bg-secondary' };
  }

  function mapDeliveryMethod(m) {
    const map = {
      delivery: 'Despacho a domicilio',
      pickup:   'Retiro en local',
    };
    return map[m] || '—';
  }

  function mapPaymentMethod(m) {
    const map = {
      card:      'Tarjeta',
      cash:      'Pago contra entrega',
      transbank: 'Tarjeta (Webpay)',
      webpay:    'Tarjeta (Webpay)',
    };
    return map[m] || m || '—';
  }

  //  Helpers para leer precio y cantidad de un ítem 
  function getItemPrice(item) {
    if (!item) return 0;

    const raw =
      item.unitPrice ??
      item.price ??
      item.valor ??
      item.product?.unitPrice ??
      item.product?.price ??
      item.product?.valor ??
      0;

    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }

  function getItemQty(item) {
    if (!item) return 0;

    const raw =
      item.quantity ??
      item.qty ??
      item.cantidad ??
      0;

    const n = Number(raw);
    return Number.isNaN(n) ? 0 : n;
  }

// order-utils.js
function getOrderTotal(order) {
  if (!order) return 0;

  // Si el backend ya calculó total, confío en eso
  if (order.total != null && !Number.isNaN(Number(order.total))) {
    return Number(order.total);
  }

  // Si no viene total, lo recalculo desde los ítems + delivery + propina
  const itemsTotal = (order.items || []).reduce((sum, it) => {
    const price = Number(it.price ?? it.unitPrice ?? 0);
    const qty   = Number(it.quantity ?? 0);
    return sum + price * qty;
  }, 0);

  const deliveryFee = Number(order.deliveryFee || 0);
  const tip         = Number(order.tip || 0);

  return itemsTotal + deliveryFee + tip;
}


  // Exportar en el namespace global
  root.formatCLP         = formatCLP;
  root.mapOrderStatus    = mapOrderStatus;
  root.mapDeliveryMethod = mapDeliveryMethod;
  root.mapPaymentMethod  = mapPaymentMethod;
  root.getItemPrice      = getItemPrice;
  root.getItemQty        = getItemQty;
  root.getOrderTotal     = getOrderTotal;
})();
