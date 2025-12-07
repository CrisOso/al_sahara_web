// nav-auth.js
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const api = window.AlSaharaAPI;

    if (!api) {
      console.warn('AlSaharaAPI no está disponible en nav-auth. ¿Falta api-client.js o hubo un error en él?');
      return;
    }

    const { getStoredUser, clearAuthSession } = api;

    const user = getStoredUser && getStoredUser();
    const authArea = document.getElementById('navAuthArea');
    const adminItem = document.getElementById('navAdminItem');

    if (!authArea) return;

    // --- SIN USUARIO ---
    if (!user) {
      authArea.innerHTML = `
        <a class="btn btn-sm btn-outline-secondary" href="login.html">Entrar</a>
        <a class="btn btn-sm btn-outline-primary" href="registro.html">Registrarse</a>
      `;
      if (adminItem) {
        adminItem.classList.add('d-none');
      }
      return;
    }

    const displayName =
      user.name && user.name.trim() !== '' ? user.name : user.email;

    // --- ADMIN ---
    if (user.role === 'admin') {
      authArea.innerHTML = `
        <span class="me-2">Hola, <strong>${displayName}</strong></span>
        <a class="btn btn-sm btn-outline-primary" href="admin.html">Panel Admin</a>
        <button type="button" class="btn btn-sm btn-outline-danger" id="btnLogout">Salir</button>
      `;
      if (adminItem) {
        adminItem.classList.remove('d-none');
      }
    } else {
      // --- USUARIO NORMAL ---
      authArea.innerHTML = `
        <span class="me-2">Hola, <strong>${displayName}</strong></span>
        <a class="btn btn-sm btn-outline-secondary" href="usuario.html">Mi Cuenta</a>
        <button type="button" class="btn btn-sm btn-outline-danger" id="btnLogout">Salir</button>
      `;
      if (adminItem) {
        adminItem.classList.add('d-none');
      }
    }

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        clearAuthSession && clearAuthSession();
        window.location.href = 'index.html';
      });
    }
  });
})();
