let activeCategory = 'all';
let activeSearch = '';
let activeSort = '';
let wishlistIds = new Set();
let cartCount = 0;
let wishlistCount = 0;
let currentCartSubtotal = 0;

document.addEventListener('DOMContentLoaded', () => {
  checkBackendConnection();
  checkAuthSession();
  loadCategories();
  loadProducts();
  setupControls();
  setupDrawers();
});

async function checkBackendConnection() {
  const statusBadge = document.getElementById('api-status');
  if (!statusBadge) return;

  try {
    const data = await apiRequest('/health');
    statusBadge.textContent = `Connected (${data.message})`;
    statusBadge.className = 'badge badge-success';
  } catch (error) {
    statusBadge.textContent = `Disconnected: ${error.message}`;
    statusBadge.className = 'badge badge-error';
  }
}

async function checkAuthSession() {
  const authNav = document.getElementById('auth-nav');
  if (!authNav) return;

  try {
    const me = await apiRequest('/auth/me');
    if (me.success && me.user) {
      const displayName = me.user.full_name || me.user.name || 'User';
      const firstName = displayName.trim().split(/\s+/)[0];
      const initials = displayName
        .split(/\s+/)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const safeName = escapeHtml(displayName);
      const safeFirstName = escapeHtml(firstName);
      const safeInitials = escapeHtml(initials);
      const adminLink = me.user.role === 'admin'
        ? '<a href="./admin.html" class="profile-menu-item"><span>Admin Panel</span></a>'
        : '';
      authNav.innerHTML = `
        <a href="#orders" id="myOrdersLink" class="nav-link nav-orders">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h16v18H4V3Zm2 2v14h12V5H6Zm2 3h8v2H8V8Zm0 4h8v2H8v-2Z"/></svg>
          <span>My Orders</span>
        </a>
        <div class="profile-menu-wrap">
          <button class="profile-pill" id="profileMenuBtn" type="button" aria-expanded="false" aria-haspopup="menu">
            <span class="profile-avatar">${safeInitials}</span>
            <span class="profile-name">Hi, ${safeFirstName}</span>
            <svg class="profile-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9.5 5 5 5-5-1.4-1.4-3.6 3.6-3.6-3.6L7 9.5Z"/></svg>
          </button>
          <div class="profile-dropdown" id="profileDropdown" role="menu">
            <div class="profile-summary">
              <strong>${safeName}</strong>
              <span>ShopSphere Account</span>
            </div>
            ${adminLink}
            <a href="#orders" id="profileOrdersLink" class="profile-menu-item">My Orders</a>
            <button id="logout-btn" class="profile-menu-item logout-item" type="button">Logout</button>
          </div>
        </div>
      `;

      const openOrders = (event) => {
        event.preventDefault();
        openOrdersDrawer();
      };
      document.getElementById('myOrdersLink')?.addEventListener('click', openOrders);
      document.getElementById('profileOrdersLink')?.addEventListener('click', openOrders);

      const profileMenuBtn = document.getElementById('profileMenuBtn');
      const profileDropdown = document.getElementById('profileDropdown');
      profileMenuBtn?.addEventListener('click', (event) => {
        event.stopPropagation();
        const open = profileDropdown.classList.toggle('open');
        profileMenuBtn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', (event) => {
        if (!event.target.closest('.profile-menu-wrap')) {
          profileDropdown?.classList.remove('open');
          profileMenuBtn?.setAttribute('aria-expanded', 'false');
        }
      });

      document.getElementById('logout-btn').addEventListener('click', async () => {
        await apiRequest('/auth/logout', { method: 'POST' });
        window.location.reload();
      });
      await Promise.all([loadCart(), loadWishlist()]);
    }
  } catch (_) {
    // Guest user
  }
}

async function loadCategories() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  try {
    const data = await apiRequest('/categories');
    const buttons = data.categories
      .map(
        (cat) =>
          `<button class="cat-btn" data-category="${cat.slug}">${cat.name}</button>`
      )
      .join('');
    container.innerHTML = `<button class="cat-btn active" data-category="all">All Products</button>${buttons}`;

    container.querySelectorAll('.cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.cat-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category;
        loadProducts();
      });
    });
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function loadProducts() {
  const grid = document.getElementById('productGrid');
  const titleEl = document.getElementById('catalogTitle');
  if (!grid) return;

  const params = new URLSearchParams();
  if (activeCategory && activeCategory !== 'all') params.set('category', activeCategory);
  if (activeSearch) params.set('search', activeSearch);
  if (activeSort) params.set('sort', activeSort);

  try {
    const queryString = params.toString() ? `?${params.toString()}` : '';
    const data = await apiRequest(`/products${queryString}`);

    if (titleEl) {
      titleEl.textContent = activeSearch
        ? `Search results for "${activeSearch}" (${data.count})`
        : 'Featured Products';
    }

    if (!data.products || data.products.length === 0) {
      grid.innerHTML = `<div class="empty-state"><p>No products matched your filter.</p></div>`;
      return;
    }

    grid.innerHTML = data.products
      .map(
        (product) => `
        <article class="product-card">
          <img src="${product.image_url}" alt="${product.name}" class="product-image" />
          <div class="product-body">
            <span class="product-cat">${product.category_name || 'General'}</span>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-desc">${product.description || ''}</p>
            <div class="product-footer">
              <span class="product-price">₹${Number(product.price).toLocaleString('en-IN')}</span>
              <div class="product-actions">
                <button class="btn-wishlist ${wishlistIds.has(product.id) ? 'active' : ''}"
                        data-wishlist-id="${product.id}"
                        title="Toggle wishlist"
                        aria-label="Toggle wishlist">${wishlistIds.has(product.id) ? '♥' : '♡'}</button>
                <button class="btn-add-cart" data-cart-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>Add to Cart</button>
              </div>
            </div>
          </div>
        </article>
      `
      )
      .join('');

    grid.querySelectorAll('.product-image').forEach((image) => {
      image.addEventListener('error', () => {
        if (image.dataset.fallbackApplied) return;
        image.dataset.fallbackApplied = 'true';
        image.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=ShopSphere';
      });
    });

    grid.querySelectorAll('[data-cart-id]').forEach((button) => {
      button.addEventListener('click', () => addToCart(Number(button.dataset.cartId)));
    });
    grid.querySelectorAll('[data-wishlist-id]').forEach((button) => {
      button.addEventListener('click', () => toggleWishlist(Number(button.dataset.wishlistId)));
    });
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>Error loading products: ${err.message}</p></div>`;
  }
}

function setupControls() {
  const searchForm = document.getElementById('searchForm');
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      activeSearch = searchInput.value.trim();
      loadProducts();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      loadProducts();
    });
  }
}

function updateNavbarCounts() {
  const wishlistLink = document.getElementById('wishlistLink');
  const cartLink = document.getElementById('cartLink');
  updateNavBadge(wishlistLink, 'Wishlist', wishlistCount);
  updateNavBadge(cartLink, 'Cart', cartCount);
}

function updateNavBadge(link, label, count) {
  if (!link) return;
  const icon = link.querySelector('svg')?.outerHTML || '';
  link.innerHTML = `${icon}<span class="nav-label">${label}</span>${count > 0 ? `<span class="nav-badge">${count}</span>` : ''}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openDrawer(drawerId) {
  document.querySelectorAll('.side-drawer').forEach((drawer) => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  });
  const drawer = document.getElementById(drawerId);
  const backdrop = document.getElementById('drawerBackdrop');
  if (drawer) {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
  }
  if (backdrop) backdrop.classList.add('open');
}

function closeDrawers() {
  document.querySelectorAll('.side-drawer').forEach((drawer) => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
  });
  const backdrop = document.getElementById('drawerBackdrop');
  if (backdrop) backdrop.classList.remove('open');
}

function setupDrawers() {
  document.getElementById('cartLink')?.addEventListener('click', (event) => {
    event.preventEvent?.();
    event.preventDefault();
    openCartDrawer();
  });
  document.getElementById('wishlistLink')?.addEventListener('click', (event) => {
    event.preventDefault();
    openWishlistDrawer();
  });
  document.getElementById('drawerBackdrop')?.addEventListener('click', closeDrawers);
  document.querySelectorAll('[data-close-drawer]').forEach((button) => {
    button.addEventListener('click', closeDrawers);
  });
  document.getElementById('proceedCheckoutBtn')?.addEventListener('click', openCheckoutModal);
  document.getElementById('closeCheckoutModal')?.addEventListener('click', closeCheckoutModal);
  document.getElementById('checkoutForm')?.addEventListener('submit', submitOrder);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDrawers();
      closeCheckoutModal();
    }
  });
}

async function refreshShopLists() {
  await Promise.all([refreshCart(), refreshWishlist()]);
}

async function loadCart() {
  await refreshCart();
}

async function loadWishlist() {
  await refreshWishlist();
}

async function refreshCart(openAfterLoad = false) {
  try {
    const data = await apiRequest('/cart');
    cartCount = data.count || 0;
    updateNavbarCounts();
    renderCart(data.cart || [], data.subtotal || 0);
    if (openAfterLoad) openDrawer('cartDrawer');
  } catch (_) {
    cartCount = 0;
    updateNavbarCounts();
  }
}

async function refreshWishlist(openAfterLoad = false) {
  try {
    const data = await apiRequest('/wishlist');
    const wishlist = data.wishlist || [];
    wishlistCount = data.count || wishlist.length;
    wishlistIds = new Set(wishlist.map((item) => item.product_id));
    updateNavbarCounts();
    renderWishlist(wishlist);
    if (openAfterLoad) openDrawer('wishlistDrawer');
  } catch (_) {
    wishlistCount = 0;
    wishlistIds = new Set();
    updateNavbarCounts();
  }
}

function formatRupees(amount) {
  return `₹${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function renderCart(cart, subtotal) {
  currentCartSubtotal = subtotal;
  const container = document.getElementById('cartDrawerItems');
  const subtotalEl = document.getElementById('cartSubtotal');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Your cart is empty.</p></div>';
  } else {
    container.innerHTML = cart.map((item) => `
      <div class="drawer-item">
        <img src="${item.image_url || ''}" alt="${item.name}" />
        <div class="drawer-item-info">
          <h3>${item.name}</h3>
          <span class="drawer-item-price">${formatRupees(item.price)}</span>
          <div class="quantity-controls">
            <button type="button" data-cart-action="minus" data-product-id="${item.product_id}" aria-label="Decrease quantity">-</button>
            <strong>${item.quantity}</strong>
            <button type="button" data-cart-action="plus" data-product-id="${item.product_id}" aria-label="Increase quantity" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
            <button type="button" class="drawer-remove" data-cart-action="remove" data-product-id="${item.product_id}">Remove</button>
          </div>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-cart-action]').forEach((button) => {
      button.addEventListener('click', async () => {
        const productId = Number(button.dataset.productId);
        const action = button.dataset.cartAction;
        if (action === 'remove') {
          await removeFromCart(productId);
        } else {
          const item = cart.find((entry) => entry.product_id === productId);
          if (item) {
            const quantity = action === 'plus' ? item.quantity + 1 : item.quantity - 1;
            await updateCartItem(productId, quantity);
          }
        }
      });
    });
  }
  if (subtotalEl) subtotalEl.textContent = formatRupees(subtotal);
}

function renderWishlist(wishlist) {
  const container = document.getElementById('wishlistDrawerItems');
  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>Your wishlist is empty.</p></div>';
  } else {
    container.innerHTML = wishlist.map((item) => `
      <div class="drawer-item">
        <img src="${item.image_url || ''}" alt="${item.name}" />
        <div class="drawer-item-info">
          <h3>${item.name}</h3>
          <span class="drawer-item-price">${formatRupees(item.price)}</span>
          <button type="button" class="move-to-cart" data-move-product-id="${item.product_id}" ${item.stock <= 0 ? 'disabled' : ''}>Move to Cart</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('[data-move-product-id]').forEach((button) => {
      button.addEventListener('click', () => moveWishlistToCart(Number(button.dataset.moveProductId)));
    });
  }
  document.querySelectorAll('[data-wishlist-id]').forEach((button) => {
    const active = wishlistIds.has(Number(button.dataset.wishlistId));
    button.classList.toggle('active', active);
    button.textContent = active ? '♥' : '♡';
  });
}

async function openCartDrawer() {
  await refreshCart(true);
}

async function openWishlistDrawer() {
  await refreshWishlist(true);
}

async function addToCart(productId) {
  try {
    await apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    await refreshCart();
  } catch (error) {
    alert(error.message);
  }
}

async function updateCartItem(productId, quantity) {
  try {
    await apiRequest(`/cart/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity })
    });
    await refreshCart();
  } catch (error) {
    alert(error.message);
  }
}

async function removeFromCart(productId) {
  try {
    await apiRequest(`/cart/${productId}`, { method: 'DELETE' });
    await refreshCart();
  } catch (error) {
    alert(error.message);
  }
}

async function toggleWishlist(productId) {
  try {
    await apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    await refreshWishlist();
  } catch (error) {
    alert(error.message);
  }
}

async function moveWishlistToCart(productId) {
  try {
    await apiRequest('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    await apiRequest('/wishlist/toggle', {
      method: 'POST',
      body: JSON.stringify({ productId })
    });
    await Promise.all([refreshCart(), refreshWishlist()]);
  } catch (error) {
    alert(error.message);
  }
}

function openCheckoutModal() {
  if (cartCount <= 0) {
    alert('Your cart is empty.');
    return;
  }

  const modal = document.getElementById('checkoutModal');
  const total = document.getElementById('checkoutTotal');
  if (total) total.textContent = formatRupees(currentCartSubtotal);
  closeDrawers();
  if (modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.getElementById('shippingAddress')?.focus();
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function submitOrder(event) {
  event.preventDefault();

  const shippingAddress = document.getElementById('shippingAddress')?.value.trim();
  const paymentMethod = document.getElementById('paymentMethod')?.value;
  const placeOrderBtn = document.getElementById('placeOrderBtn');
  if (!shippingAddress) return;

  try {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.textContent = 'Placing Order...';
    }

    const data = await apiRequest('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress, paymentMethod })
    });

    closeCheckoutModal();
    document.getElementById('checkoutForm')?.reset();
    await refreshCart();
    alert(data.message || 'Order placed successfully.');
  } catch (error) {
    alert(error.message);
  } finally {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Place Order';
    }
  }
}

async function openOrdersDrawer() {
  const container = document.getElementById('ordersDrawerItems');
  if (container) container.innerHTML = '<div class="empty-state"><p>Loading orders...</p></div>';

  try {
    const data = await apiRequest('/orders');
    closeDrawers();
    renderOrders(data.orders || []);
    openDrawer('ordersDrawer');
  } catch (error) {
    alert(error.message);
  }
}

function renderOrders(orders) {
  const container = document.getElementById('ordersDrawerItems');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>You have no orders yet.</p></div>';
    return;
  }

  container.innerHTML = orders.map((order) => {
    const date = new Date(order.created_at).toLocaleString('en-IN');
    const items = (order.items || []).map((item) =>
      `<div>${item.quantity} x ${item.product_name} - ${formatRupees(Number(item.unit_price) * item.quantity)}</div>`
    ).join('');

    return `
      <article class="order-card">
        <div class="order-card-header">
          <strong>Order #${order.id}</strong>
          <span class="order-status">${order.status}</span>
        </div>
        <div class="order-card-items">${items}</div>
        <div style="margin-top:0.55rem;"><strong>Total:</strong> ${formatRupees(order.total_amount)}</div>
        <div><strong>Payment:</strong> ${order.payment_method}</div>
        <div><strong>Address:</strong> ${order.shipping_address}</div>
        <div style="color:#64748b;font-size:0.82rem;margin-top:0.35rem;">${date}</div>
      </article>
    `;
  }).join('');
}