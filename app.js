// Interacciones: toasts, skeletons, filtros, estados vacíos, quick view
document.addEventListener('DOMContentLoaded', () => {
  // Toast global (Agregar)
  const toastEl = document.getElementById('toastAdded');
  const productToast = toastEl ? new bootstrap.Toast(toastEl) : null;
  document.querySelectorAll('.js-add').forEach(btn => {
    btn.addEventListener('click', () => productToast?.show());
  });

  // Skeletons Home
  const skHome = document.getElementById('skeletonHome');
  const realHome = document.getElementById('realHome');
  if (skHome && realHome) {
    setTimeout(() => { skHome.classList.add('d-none'); realHome.classList.remove('d-none'); }, 600);
  }

  // Catalog: skeletons + filtros + estado vacío + quick view
  const skGrid = document.getElementById('skeletonGrid');
  const realGrid = document.getElementById('realGrid');
  const emptyCatalog = document.getElementById('emptyCatalog');
  const searchInput = document.getElementById('q');
  let selectedCat = "";
  const cards = Array.from(document.querySelectorAll('#realGrid [data-name]'));

  function applyFilter(){
    const term = (searchInput?.value || "").trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const name = (card.dataset.name || "").toLowerCase();
      const cat = card.dataset.cat || "";
      const match = (!term || name.includes(term)) && (!selectedCat || cat === selectedCat);
      card.classList.toggle('d-none', !match);
      if (match) visible++;
    });
    if (visible === 0) { realGrid?.classList.add('d-none'); emptyCatalog?.classList.remove('d-none'); }
    else { emptyCatalog?.classList.add('d-none'); realGrid?.classList.remove('d-none'); }
  }

  function withSkeleton(cb){
    if (!skGrid || !realGrid){ cb(); return; }
    skGrid.classList.remove('d-none'); realGrid.classList.add('d-none'); emptyCatalog?.classList.add('d-none');
    setTimeout(()=>{ skGrid.classList.add('d-none'); cb(); }, 450);
  }

  if (skGrid && realGrid){
    setTimeout(()=>{ skGrid.classList.add('d-none'); realGrid.classList.remove('d-none'); }, 700);
  }

  searchInput?.addEventListener('input', () => withSkeleton(applyFilter));
  document.querySelectorAll('[data-filter-cat]').forEach(el => {
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      document.querySelectorAll('[data-filter-cat]').forEach(x=>x.classList.remove('active'));
      el.classList.add('active');
      selectedCat = el.dataset.filterCat || "";
      withSkeleton(applyFilter);
    });
  });

  // Quick view modal fill
  const qv = document.getElementById('quickView');
  const qvTitle = qv?.querySelector('.js-qv-title');
  const qvDesc = qv?.querySelector('.js-qv-desc');
  const qvPrice = qv?.querySelector('.js-qv-price');
  const qvImg = qv?.querySelector('.js-qv-img');
  document.querySelectorAll('.js-quickview').forEach(btn => {
    btn.addEventListener('click', ()=>{
      const card = btn.closest('[data-name]');
      if (!card) return;
      if (qvTitle) qvTitle.textContent = card.dataset.name || '';
      if (qvDesc) qvDesc.textContent = card.dataset.desc || '';
      if (qvPrice) qvPrice.textContent = `$${card.dataset.price || ''}`;
      if (qvImg){ qvImg.src = card.dataset.img || ''; qvImg.alt = card.dataset.name || ''; }
    });
  });

  // Estados vacíos (demo)
  document.getElementById('emptyCartBtn')?.addEventListener('click', ()=>{
    document.getElementById('cartTable')?.classList.add('d-none');
    document.getElementById('cartSummary')?.classList.add('d-none');
    document.getElementById('emptyCart')?.classList.remove('d-none');
  });
  document.getElementById('emptyOrdersBtn')?.addEventListener('click', ()=>{
    document.getElementById('ordersList')?.classList.add('d-none');
    document.getElementById('emptyOrders')?.classList.remove('d-none');
  });
});
