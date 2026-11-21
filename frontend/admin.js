document.addEventListener('DOMContentLoaded', initializeAdmin);

const rupees = (amount) => `₹${Number(amount).toLocaleString('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})}`;

async function initializeAdmin() {
  try {
    const me = await apiRequest('/auth/me');
    if (!me.user || me.user.role !== 'admin') {
      window.location.replace('./index.html');
      return;
    }
    document.getElementById('adminUser').textContent = me.user.full_name;
    await Promise.all([loadStats(), loadCategories(), loadProducts(), loadOrders()]);
  } catch (_) {
    window.location.replace('./auth.html');
  }

  document.getElementById('productForm').addEventListener('submit', createProduct);
  document.getElementById('logout-btn').addEventListener('click', logout);
}

function showMessage(message, isError = false) {
  const element = document.getElementById('adminMessage');
  element.textContent = message;
  element.className = `admin-message ${isError ? 'error' : 'success'}`;
  element.style.display = message ? 'block' : 'none';
  if (message) setTimeout(() => { element.style.display = 'none'; }, 4000);
}

async function logout() {
  await apiRequest('/auth/logout', { method: 'POST' });
  window.location.href = './index.html';
}

async function loadStats() {
  const data = await apiRequest('/admin/stats');
  document.getElementById('revenueKpi').textContent = rupees(data.stats.revenue);
  document.getElementById('ordersKpi').textContent = data.stats.orders;
  document.getElementById('productsKpi').textContent = data.stats.products;
  document.getElementById('lowStockKpi').textContent = data.stats.lowStock;
}

async function loadCategories() {
  const data = await apiRequest('/categories');
  document.getElementById('categorySelect').innerHTML =
    '<option value="">General</option>' +
    data.categories.map((category) =>
      `<option value="${category.id}">${escapeHtml(category.name)}</option>`
    ).join('');
}

async function loadProducts() {
  const data = await apiRequest('/admin/products');
  document.getElementById('inventoryCount').textContent = `${data.count} items`;
  const tbody = document.getElementById('inventoryTable');

  if (!data.products.length) {
    tbody.innerHTML = '<tr><td colspan="5">No active products.</td></tr>';
    return;
  }

  tbody.innerHTML = data.products.map((product) => `
    <tr>
      <td><strong>${escapeHtml(product.name)}</strong></td>
      <td>${escapeHtml(product.category_name || 'General')}</td>
      <td>${rupees(product.price)}</td>
      <td><span class="${Number(product.stock) <= 5 ? 'stock-low' : ''}">${product.stock}</span></td>
      <td><button class="delete-product" type="button" data-product-id="${product.id}">Delete</button></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-product-id]').forEach((button) => {
    button.addEventListener('click', () => deleteProduct(Number(button.dataset.productId)));
  });
}

async function createProduct(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());
  payload.category_id = payload.category_id ? Number(payload.category_id) : null;
  payload.price = Number(payload.price);
  payload.stock = Number(payload.stock);

  try {
    await apiRequest('/admin/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    form.reset();
    form.elements.stock.value = '0';
    showMessage('Product added successfully.');
    await Promise.all([loadStats(), loadProducts()]);
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function deleteProduct(productId) {
  if (!confirm('Delete this product from the store?')) return;
  try {
    await apiRequest(`/admin/products/${productId}`, { method: 'DELETE' });
    showMessage('Product deleted successfully.');
    await Promise.all([loadStats(), loadProducts()]);
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadOrders() {
  const data = await apiRequest('/admin/orders');
  document.getElementById('fulfillmentCount').textContent = `${data.count} orders`;
  const tbody = document.getElementById('ordersTable');

  if (!data.orders.length) {
    tbody.innerHTML = '<tr><td colspan="6">No orders yet.</td></tr>';
    return;
  }

  tbody.innerHTML = data.orders.map((order) => {
    const itemCount = order.items.reduce((sum, item) => sum + Number(item.quantity), 0);
    const status = String(order.status).toLowerCase();
    return `
      <tr>
        <td><strong>#${order.id}</strong></td>
        <td>${escapeHtml(order.full_name || 'Customer')}<br><small>${escapeHtml(order.email || '')}</small></td>
        <td>${itemCount}</td>
        <td>${rupees(order.total_amount)}</td>
        <td>
          <select class="status-select" data-order-id="${order.id}" aria-label="Status for order ${order.id}">
            ${['confirmed', 'shipped', 'delivered', 'cancelled'].map((value) =>
              `<option value="${value}" ${value === status ? 'selected' : ''}>${capitalize(value)}</option>`
            ).join('')}
          </select>
        </td>
        <td>${new Date(order.created_at).toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('[data-order-id]').forEach((select) => {
    select.addEventListener('change', () => updateOrderStatus(Number(select.dataset.orderId), select.value));
  });
}

async function updateOrderStatus(orderId, status) {
  try {
    await apiRequest(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    showMessage(`Order #${orderId} updated to ${capitalize(status)}.`);
    await Promise.all([loadStats(), loadOrders()]);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value);
  return div.innerHTML;
}
