// app.js
document.addEventListener('DOMContentLoaded', () => {
  //  TOAST "AGREGADO AL CARRITO"
  const toastEl = document.getElementById('toastAdded');
  const productToast = toastEl ? new bootstrap.Toast(toastEl) : null;
  
  function getUnitPriceFromCard(card) {
    if (!card) return undefined;

    // numérico directo desde data-unit-price
    if (card.dataset.unitPrice) {
      const n = Number(card.dataset.unitPrice);
      if (!Number.isNaN(n)) return n;
    }

    // string tipo "5.990"
    if (card.dataset.price) {
      const clean = card.dataset.price.replace(/\./g, '').replace(',', '.');
      const n = Number(clean);
      if (!Number.isNaN(n)) return n;
    }
    return undefined;
  }
  
  async function handleAddClick(btn) {
    const api = window.AlSaharaAPI;
    const card = btn.closest('[data-name]');
    const productId =
      btn.dataset.productId ||
      card?.dataset.productId ||
      card?.dataset.name ||
      undefined;

    try {
      if (api && productId) {
        const unitPrice = getUnitPriceFromCard(card);

        await api.alSaharaFetch('/cart/items', {
          method: 'POST',
          body: {
            productId,
            quantity: 1,
            unitPrice,
          },
        });
      }
    } catch (e) {
      console.error('Error agregando al carrito', e);
    } finally {
      productToast?.show();
    }
  }

  // Delegación global para botones "Agregar"
  document.body.addEventListener('click', (event) => {
    const btn = event.target.closest('.js-add');
    if (!btn) return;
    event.preventDefault();
    handleAddClick(btn);
  });

  //  index – Destacados: 4 productos más vendidos
  const skHome  = document.getElementById('skeletonHome');
  const realHome = document.getElementById('realHome');

  // Resolver ruta de imagen de producto
  function resolveProductImage(p) {
    const apiBase = window.AlSaharaAPI?.API_BASE || '';

    // Sin imagen en BD → usamos una local del front
    if (!p || !p.image) {
      return 'placeholder.jpg';
    }

    const img = p.image;

    // Si ya es URL absoluta (http/https)
    if (/^https?:\/\//i.test(img)) {
      return img;
    }

    // Para rutas tipo "/images/xxx.jpg" o "images/xxx.jpg" → backend
    const cleaned = img.startsWith('/') ? img : '/' + img;

    // apiBase = "http://localhost:4000"
    return apiBase.replace(/\/+$/, '') + cleaned;
  }

  // Construir card de destacado
  function buildHighlightCard(p, index, fmt) {
    const pid   = p.id || p._id || '';
    const name  = p.name || '';
    const desc  = p.description || '';
    const price = Number(p.price) || 0;
    const img   = resolveProductImage(p);

    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-3';

    const ribbonHtml = index === 0
      ? '<span class="ribbon">Más vendido</span>'
      : '';

    col.innerHTML = `
      <div class="card h-100 card-elev position-relative"
          data-name="${name}"
          data-img="${img}"
          data-desc="${desc}"
          data-price="${fmt.format(price)}"
          data-unit-price="${price}"
          data-product-id="${pid}"
          data-cat="destacados">
        ${ribbonHtml}
        <img src="${img}" class="card-img-top" alt="${name}">
        <div class="card-body d-flex flex-column">
          <h3 class="h6 mb-1">${name}</h3>
          <p class="small text-muted flex-grow-1">${desc}</p>
          <div class="d-flex justify-content-between align-items-center">
            <span class="price">${fmt.format(price)}</span>
            <div class="btn-group">
              <button class="btn btn-sm btn-primary js-add" data-product-id="${pid}">Agregar</button>
              <button class="btn btn-sm btn-outline-secondary js-quickview" type="button"
                      data-bs-toggle="modal" data-bs-target="#quickView">
                Ver
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return col;
  }

  async function hydrateHomeHighlights() {
    if (!skHome || !realHome || !window.AlSaharaAPI) return;

    const api = window.AlSaharaAPI;
    const fmt = new Intl.NumberFormat('es-CL');

    // Mostrar skeleton
    skHome.classList.remove('d-none');
    realHome.classList.add('d-none');
    realHome.innerHTML = '';

    let best = null;

    // Intentar usar endpoint de reportes (top productos)
    try {
      const stats = await api.alSaharaFetch('/reports/products/top?limit=4')
        .catch(() => null);

      if (Array.isArray(stats) && stats.length) {
        const allProducts = await api.alSaharaFetch('/products');
        const productsArr = Array.isArray(allProducts) ? allProducts : [];
        const mapProd = {};
        productsArr.forEach(p => {
          const pid = p.id || p._id;
          if (pid) mapProd[pid] = p;
        });

        const list = [];
        stats.forEach(row => {
          const pid = row.productId || row.product_id || row._id || null;
          const sold = Number(
            row.totalQuantity ?? row.qty ?? row.count ?? 0
          );
          if (!pid || !mapProd[pid]) return;
          list.push({ ...mapProd[pid], sold });
        });

        list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
        best = list.slice(0, 4);
      }
    } catch (e) {
      console.warn('[home] Error obteniendo /reports/products/top, usando fallback', e);
    }

    // Fallback: si no hay reportes, usar los primeros 4 productos activos
    if (!best) {
      try {
        const allProducts = await api.alSaharaFetch('/products');
        const arr = Array.isArray(allProducts) ? allProducts : [];
        best = arr.slice(0, 4);
      } catch (e) {
        console.error('[home] No se pudieron cargar productos para destacados', e);
        skHome.classList.add('d-none');
        realHome.classList.remove('d-none');
        return;
      }
    }

    // Renderizar las 4 cards
    best.forEach((p, index) => {
      const col = buildHighlightCard(p, index, fmt);
      realHome.appendChild(col);
    });

    // Ocultar skeleton, mostrar reales
    skHome.classList.add('d-none');
    realHome.classList.remove('d-none');
  }

  // Disparar la hidratación de destacados si estamos en index
  if (skHome && realHome) {
    hydrateHomeHighlights();
  }

  // CATÁLOGO (catalogo.html)
  const skGrid        = document.getElementById('skeletonGrid');
  const realGrid      = document.getElementById('realGrid');
  const skeletonGrid  = document.getElementById('skeletonGrid');
  const emptyCatalog  = document.getElementById('emptyCatalog');
  const searchInput   = document.getElementById('q');
  const sortSelect    = document.querySelector('select'); // el select de "Ordenar"

  let allProducts     = [];
  let currentSearch   = '';
  let currentCategory = '';
  let currentSort     = '';

  // Categoría de un producto según el nuevo modelo
  function getProductCategoryId(p) {
    if (!p) return '';
    if (p.categoryId) return String(p.categoryId).toLowerCase();

    // compatibilidad con posibles datos viejos
    if (p.category && typeof p.category === 'string') {
      return p.category.toLowerCase();
    }
    if (p.category && (p.category.slug || p.category.id)) {
      return String(p.category.slug || p.category.id).toLowerCase();
    }
    return '';
  }

  // Render del grid de productos 
  function renderProductsGrid(products) {
    if (!realGrid || !skeletonGrid || !emptyCatalog) return;

    skeletonGrid.classList.add('d-none');

    if (!products.length) {
      realGrid.classList.add('d-none');
      emptyCatalog.classList.remove('d-none');
      realGrid.innerHTML = '';
      return;
    }

    emptyCatalog.classList.add('d-none');
    realGrid.classList.remove('d-none');

    const fmt = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    });

    realGrid.innerHTML = products
      .map((p) => {
        const id        = p.id || p._id || '';
        const rawPrice  = Number(p.price || 0);
        const priceText = fmt.format(rawPrice);

        // imagen: si viene desde backend como "/images/xxx.jpg", la colgamos de API_BASE
        const apiBase = window.AlSaharaAPI?.API_BASE || '';
        let imgPath;

        if (!p.image) {
          // Fallback local del front
          imgPath = 'img/shawarma.jpg';
        } else if (/^https?:\/\//i.test(p.image)) {
          // Ya es absoluta
          imgPath = p.image;
        } else {
          // "/images/xxx.jpg" o "images/xxx.jpg" → backend
          const cleaned = p.image.startsWith('/')
            ? p.image
            : '/' + p.image;

          imgPath = apiBase.replace(/\/+$/, '') + cleaned;
        }

        const safeName = (p.name || '').replace(/"/g, '&quot;');
        const safeDesc = (p.description || '').replace(/"/g, '&quot;');

        return `
          <div class="col-6 col-md-4 col-lg-3">
            <article
              class="card h-100 card-elev product-card"
              data-product-id="${id}"
              data-name="${safeName}"
              data-desc="${safeDesc}"
              data-price="${priceText}"
              data-unit-price="${rawPrice}"
              data-img="${imgPath}"
            >
              <img src="${imgPath}" class="card-img-top" alt="${safeName}">
              <div class="card-body d-flex flex-column">
                <h3 class="h6 mb-1">${safeName}</h3>
                <p class="small text-muted flex-grow-1">${safeDesc}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <span class="price">${priceText}</span>
                  <div class="btn-group">
                    <button
                      class="btn btn-sm btn-primary js-add"
                      type="button"
                      data-product-id="${id}"
                    >
                      Agregar
                    </button>
                    <button
                      class="btn btn-sm btn-outline-secondary js-quickview"
                      type="button"
                      data-bs-toggle="modal"
                      data-bs-target="#quickView"
                    >
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>`;
      })
      .join('');
  }

  //  Aplica búsqueda, categoría y orden 
  function applyFiltersAndRender() {
    if (!Array.isArray(allProducts)) allProducts = [];

    let filtered = allProducts.slice();

    // Categoría
    filtered = filtered.filter((p) => {
      const catId = getProductCategoryId(p);
      if (!currentCategory) return true;            // "" = Todos
      return catId === currentCategory;             // 'shawarma', 'kebab', etc.
    });

    // Búsqueda
    if (currentSearch) {
      filtered = filtered.filter((p) => {
        const text = `${p.name || ''} ${p.description || ''}`.toLowerCase();
        return text.includes(currentSearch);
      });
    }

    // Orden
    if (currentSort === 'precio-asc') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (currentSort === 'precio-desc') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }

    renderProductsGrid(filtered);
  }

  // Helper skeleton 
  function withSkeleton(cb) {
    if (!skGrid || !realGrid) {
      cb();
      return;
    }
    skGrid.classList.remove('d-none');
    realGrid.classList.add('d-none');
    emptyCatalog?.classList.add('d-none');
    setTimeout(() => {
      skGrid.classList.add('d-none');
      cb();
    }, 450);
  }

  // Click en categorías (pills) 
  function setActiveCategoryFromPill(pill) {
    document
      .querySelectorAll('[data-filter-cat]')
      .forEach((a) => a.classList.remove('active'));

    pill.classList.add('active');
    currentCategory = (pill.dataset.filterCat || '').toLowerCase();
    applyFiltersAndRender();
  }

  document.querySelectorAll('[data-filter-cat]').forEach((pill) => {
    pill.addEventListener('click', (ev) => {
      ev.preventDefault();
      setActiveCategoryFromPill(pill);
    });
  });

  // Búsqueda 
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      currentSearch = searchInput.value.trim().toLowerCase();
      applyFiltersAndRender();
    });
  }

  // Orden 
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      const val = sortSelect.value || '';
      currentSort = val;
      applyFiltersAndRender();
    });
  }

  // Cargar productos desde la API y rellenar allProducts
  async function loadProductsFromApi() {
    const api = window.AlSaharaAPI;
    if (!api || !realGrid) return;

    try {
      const data = await api.alSaharaFetch('/products', { method: 'GET' });
      const raw = Array.isArray(data) ? data : [];

      allProducts = raw.map((p) => ({
        ...p,
        id: p.id || p._id || null,
      }));

      applyFiltersAndRender();
    } catch (e) {
      console.error('Error cargando productos para el catálogo', e);
      if (skeletonGrid) skeletonGrid.classList.add('d-none');
      if (emptyCatalog) emptyCatalog.classList.remove('d-none');
    }
  }

  // Activar skeleton inicial y cargar productos
  if (realGrid && window.AlSaharaAPI) {
    withSkeleton(() => {
      loadProductsFromApi();
    });
  }

  // Quick view con delegación
  const qv = document.getElementById('quickView');
  const qvTitle = qv?.querySelector('.js-qv-title');
  const qvDesc = qv?.querySelector('.js-qv-desc');
  const qvPrice = qv?.querySelector('.js-qv-price');
  const qvImg = qv?.querySelector('.js-qv-img');

  document.body.addEventListener('click', (event) => {
    const btn = event.target.closest('.js-quickview');
    if (!btn || !qv) return;
    const card = btn.closest('[data-name]');
    if (!card) return;
    if (qvTitle) qvTitle.textContent = card.dataset.name || '';
    if (qvDesc) qvDesc.textContent = card.dataset.desc || '';
    if (qvPrice) qvPrice.textContent = `${card.dataset.price || ''}`;
    if (qvImg) {
      qvImg.src = card.dataset.img || '';
      qvImg.alt = card.dataset.name || '';
    }
  });

  // Hidratar catálogo desde la API
  if (realGrid && window.AlSaharaAPI) {
    withSkeleton(() => {
      loadProductsFromApi();
    });
  }

  //  CARRITO (carrito.html)

  // mapa de productos para mostrar nombre "bonito"
  let productsById = {};

  async function ensureProductsMap() {
    if (Object.keys(productsById).length > 0 || !window.AlSaharaAPI) return;
    try {
      const products = await window.AlSaharaAPI.alSaharaFetch('/products');
      productsById = {};
      products.forEach((p) => {
        const pid = p.id || p._id;
        if (pid) {
          productsById[pid] = p;
        }
      });
    } catch (e) {
      console.error(
        'No se pudo cargar el listado de productos para el carrito',
        e
      );
    }
  }

  function getProductName(productId) {
    return productsById[productId]?.name || productId;
  }

  const cartContainer = document.getElementById('cartItemsContainer');
  const emptyCart = document.getElementById('emptyCart');
  const subtotalEl = document.getElementById('subtotalAmount');
  const deliveryEl = document.getElementById('deliveryAmount');
  const tipEl = document.getElementById('tipAmount');
  const totalEl = document.getElementById('totalAmount');
  const propinaSelect = document.getElementById('propinaSelect');
  const confirmOrderBtn = document.getElementById('btnConfirmOrder');

  let lastCart = null;
  const DELIVERY_FEE_DELIVERY = 3000; // costo fijo de despacho

  function recalcTotals() {
    if (!lastCart) return;
    const fmt = new Intl.NumberFormat('es-CL');

    const baseSubtotal = Number(lastCart.subtotal) || 0;
    const deliveryFee  = Number(lastCart.deliveryFee) || 0;

    const tipPercent = propinaSelect ? Number(propinaSelect.value) : 0;
    const tipValue = Math.round(baseSubtotal * tipPercent);

    if (subtotalEl) subtotalEl.textContent = '$' + fmt.format(baseSubtotal);
    if (deliveryEl) deliveryEl.textContent = '$' + fmt.format(deliveryFee);
    if (tipEl)      tipEl.textContent      = '$' + fmt.format(tipValue);
    if (totalEl) {
      totalEl.textContent =
        '$' + fmt.format(baseSubtotal + deliveryFee + tipValue);
    }
  }

  async function loadCart() {
    if (!cartContainer || !window.AlSaharaAPI) return;

    cartContainer.innerHTML = '';
    emptyCart?.classList.add('d-none');

    // primero cargamos el mapa de productos (para nombres bonitos)
    await ensureProductsMap();

    let cart;
    try {
      cart = await window.AlSaharaAPI.alSaharaFetch('/cart', { method: 'GET' });
    } catch (e) {
      console.error('Error al cargar carrito', e);
      emptyCart?.classList.remove('d-none');
      return;
    }

    lastCart = cart;

    const items = cart.items || [];
    const fmt = new Intl.NumberFormat('es-CL');

    // Aquí calculamos SIEMPRE el subtotal desde los ítems
    let subtotalCalc = 0;
    items.forEach((item) => {
      const price = Number(item.unitPrice ?? item.price ?? 0);
      const qty   = Number(item.quantity ?? 0);
      subtotalCalc += price * qty;
    });
    // y lo guardamos en lastCart para que recalcTotals lo use
    lastCart.subtotal = subtotalCalc;

    // si el backend no tiene deliveryFee, inicializamos en 0
    if (typeof lastCart.deliveryFee !== 'number') {
      lastCart.deliveryFee = 0;
    }

    if (items.length === 0) {
      emptyCart?.classList.remove('d-none');
      recalcTotals();
      return;
    }

    items.forEach((item) => {
      const displayName = getProductName(item.productId);

      const row = document.createElement('section');
      row.className = 'card shadow-sm mb-3';
      row.innerHTML = `
        <div class="card-body">
          <div class="row g-3 align-items-center">
            <div class="col-12 col-md-5">
              <div class="fw-semibold">${displayName}</div>
              <div class="small text-muted">
                Unitario: ${fmt.format(item.unitPrice || 0)}
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="small text-muted mt-2">Cantidad</div>
              <input type="number"
                    class="form-control form-control-sm js-cart-qty"
                    value="${item.quantity || 1}"
                    min="1"
                    data-product-id="${item.productId}">
            </div>
            <div class="col-6 col-md-3 text-md-end">
              <div class="small text-muted mb-1">Subtotal</div>
              <div class="fw-semibold js-cart-subtotal">
                ${fmt.format((item.unitPrice || 0) * (item.quantity || 1))}
              </div>
              <button class="btn btn-outline-secondary btn-sm mt-3 js-cart-remove"
                      data-product-id="${item.productId}">
                Quitar
              </button>
            </div>
          </div>
        </div>
      `;
      cartContainer.appendChild(row);
    });

    recalcTotals();
  }

  // Cambiar cantidad y quitar productos (delegación)
  if (cartContainer) {
    cartContainer.addEventListener('input', (event) => {
      const input = event.target.closest('.js-cart-qty');
      if (!input) return;
      const productId = input.dataset.productId;
      let quantity = Number(input.value) || 1;
      if (quantity < 1) quantity = 1;
      input.value = String(quantity);

      window.AlSaharaAPI
        ?.alSaharaFetch(`/cart/items/${encodeURIComponent(productId)}`, {
          method: 'PATCH',
          body: { quantity },
        })
        .then((cart) => {
          lastCart = cart;
          loadCart();
        })
        .catch((e) => console.error('Error actualizando cantidad', e));
    });

    cartContainer.addEventListener('click', (event) => {
      const btn = event.target.closest('.js-cart-remove');
      if (!btn) return;
      const productId = btn.dataset.productId;

      window.AlSaharaAPI
        ?.alSaharaFetch(`/cart/items/${encodeURIComponent(productId)}`, {
          method: 'DELETE',
        })
        .then((cart) => {
          lastCart = cart;
          loadCart();
        })
        .catch((e) => console.error('Error eliminando del carrito', e));
    });

    loadCart();
  }

  if (propinaSelect) {
    propinaSelect.addEventListener('change', () => {
      if (!lastCart) return;
      recalcTotals();
    });
  }

  //  CHECKOUT: CREAR PEDIDO (desde carrito)
  async function handleConfirmOrder() {
    if (!window.AlSaharaAPI) {
      alert('API no disponible.');
      return;
    }

    if (!lastCart || !lastCart.items || lastCart.items.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    const user = window.AlSaharaAPI.getStoredUser?.() || null;

    // Método de entrega y dirección
    const entrega = delivery?.checked ? 'delivery' : 'pickup';
    const address =
      entrega === 'delivery' ? (addressInput?.value || '').trim() : null;
    if (entrega === 'delivery' && !address) {
      alert('Por favor ingresa una dirección para delivery.');
      return;
    }

    // Método de pago elegido en el carrito
    const pagoTarjeta = document.getElementById('optTarjeta')?.checked;
    const paymentMethod = pagoTarjeta ? 'card' : 'cash';

    // Propina
    const tipPercent = propinaSelect ? Number(propinaSelect.value) : 0;
    const tipValue = Math.round((lastCart.subtotal || 0) * tipPercent);

    // Si es retiro, el envío debe ser 0.
    const baseDelivery =
      entrega === 'delivery' ? (lastCart.deliveryFee || 0) : 0;

    const total =
      (lastCart.subtotal || 0) + baseDelivery + tipValue;

    // Enriquecemos los items con el nombre del producto
    const payloadItems = (lastCart.items || []).map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice ?? it.price ?? 0,
      productName: getProductName(it.productId),
    }));

    // Nota opcional del pedido
    const noteInput = document.getElementById('orderNote');
    const note = noteInput ? noteInput.value.trim() : '';

    // Datos del usuario (si está logeado)
    const customerName = user?.name || null;
    const customerEmail = user?.email || null;
    const customerUserId = user?.id || null;
    const customerPhone = user?.phone || null;

    const payload = {
      cartId: lastCart.id,
      items: payloadItems,
      subtotal: lastCart.subtotal,
      deliveryFee: baseDelivery,
      tip: tipValue,
      total,
      customerName,
      customerEmail,
      customerUserId,
      customerPhone,
      deliveryMethod: entrega,
      paymentMethod,
      address,
      note,
    };

    try {
      const order = await window.AlSaharaAPI.alSaharaFetch('/orders', {
        method: 'POST',
        body: payload,
      });
      const orderId = order._id || order.id;

      if (!orderId) {
        console.error('No se pudo obtener el ID de la orden', order);
        alert('No se pudo crear la orden (sin ID). Intenta nuevamente.');
        return;
      }

      alert('Pedido creado correctamente.');

      if (paymentMethod === 'card') {
        window.location.href =
          `caja_virtual.html?order=${encodeURIComponent(orderId)}`;
      } else {
        window.location.href =
          `comprobante.html?order=${encodeURIComponent(orderId)}`;
      }
    } catch (e) {
      console.error('Error creando pedido', e);
      alert(e.message || 'No se pudo crear el pedido.');
    }
  }

  if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', handleConfirmOrder);
  }

  //  LÓGICA RETIRO / DELIVERY (carrito.html)
  const retiro = document.getElementById('optRetiro');
  const delivery = document.getElementById('optDelivery');
  const addressCard = document.getElementById('addressCard');
  const addressInput = document.getElementById('addressInput');

  if (retiro && delivery && addressCard && addressInput) {
    function toggleAddress() {
      const show = delivery.checked;
      addressCard.classList.toggle('d-none', !show);
      addressInput.disabled = !show;
      addressInput.setAttribute('aria-hidden', String(!show));
      if (!show) addressInput.value = '';

      if (lastCart) {
        if (show) {
          // Delivery: cobramos $3.000
          lastCart.deliveryFee = DELIVERY_FEE_DELIVERY;
        } else {
          // Retiro: envío 0
          lastCart.deliveryFee = 0;
        }
        recalcTotals();
      }
    }

    retiro.addEventListener('change', toggleAddress);
    delivery.addEventListener('change', toggleAddress);
    toggleAddress();
  }
});
