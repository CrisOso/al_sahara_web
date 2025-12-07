// api-client.js
(function () {
  const API_BASE = 'http://localhost:4000';

  function getStoredUser() {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getToken() {
    return localStorage.getItem('token') || null;
  }

  function setAuthSession(token, user) {
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }

  function clearAuthSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  function getCartId() {
    return localStorage.getItem('cartId') || null;
  }

  function setCartId(id) {
    if (!id) return;
    try {
      localStorage.setItem('cartId', id);
    } catch (e) {
      console.warn('[api-client] no se pudo guardar cartId', e);
    }
  }

  async function alSaharaFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    const hasBody = options.body !== undefined && options.body !== null;
    const isFormData = hasBody && options.body instanceof FormData;

    // Si hay body y NO es FormData, asumimos JSON
    if (hasBody && !isFormData) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      if (typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
      }
    }

    // Obtenemos token y cartId desde localStorage
    const token = getToken();
    const cartId = getCartId();

    // Si hay token y aún no hay Authorization, lo agregamos
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    // Si hay cartId y aún no se envía, lo agregamos
    if (cartId && !headers.has('X-Cart-Id')) {
      headers.set('X-Cart-Id', cartId);
    }

    const res = await fetch(API_BASE + path, {
      ...options,
      headers,
    });

    const headerCartId = res.headers.get('X-Cart-Id');
    if (headerCartId) {
      setCartId(headerCartId);
    }

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json().catch(() => null) : null;

    if (!headerCartId && data && typeof data === 'object' && path.startsWith('/cart')) {
      const bodyCartId = data.cartId || data.id || data.cart?.cartId;
      if (bodyCartId) {
        setCartId(bodyCartId);
      }
    }

    if (!res.ok) {
      const message = data?.message || `Error ${res.status}`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      console.error('[alSaharaFetch] error', err);
      throw err;
    }

    return data;
  }

  window.AlSaharaAPI = {
    API_BASE,
    getToken,
    getStoredUser,
    setAuthSession,
    clearAuthSession,
    getCartId,
    setCartId,
    alSaharaFetch,
  };
})();
