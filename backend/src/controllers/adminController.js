const db = require('../config/db');

const allowedStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

exports.getStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        COALESCE(SUM(CASE WHEN LOWER(status) <> 'cancelled' THEN total_amount ELSE 0 END), 0) AS revenue,
        COUNT(*) AS orders,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS products,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND stock <= 5) AS low_stock
      FROM orders
    `);

    const stats = result.rows[0];
    res.status(200).json({
      success: true,
      stats: {
        revenue: Number(stats.revenue),
        orders: Number(stats.orders),
        products: Number(stats.products),
        lowStock: Number(stats.low_stock)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT p.id, p.name, p.slug, p.description, p.price, p.stock,
             p.image_url, p.is_featured, p.is_active, p.created_at,
             c.id AS category_id, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.is_active = TRUE
      ORDER BY p.created_at DESC, p.id DESC
    `);
    res.status(200).json({ success: true, count: result.rows.length, products: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const {
      name, description = '', price, stock = 0,
      image_url = '', category_id = null, sku = null
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Product name is required.' });
    }
    if (price === undefined || price === null || Number(price) < 0) {
      return res.status(400).json({ success: false, message: 'A valid price is required.' });
    }
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative integer.' });
    }

    const baseSlug = slugify(String(name));
    if (!baseSlug) {
      return res.status(400).json({ success: false, message: 'Product name must contain a letter or number.' });
    }

    let slug = baseSlug;
    let suffix = 1;
    while ((await db.query('SELECT id FROM products WHERE slug = $1', [slug])).rows.length > 0) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const productSku = sku && String(sku).trim()
      ? String(sku).trim()
      : `${slug}-sku`;

    const result = await db.query(`
      INSERT INTO products (
        category_id, name, slug, description, price, sku, stock, image_url, is_featured, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, true)
      RETURNING *
    `, [
      category_id || null,
      String(name).trim(),
      slug,
      String(description),
      Number(price).toFixed(2),
      productSku,
      Number(stock),
      String(image_url).trim() || null
    ]);

    res.status(201).json({ success: true, message: 'Product created successfully.', product: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A product with that SKU or slug already exists.' });
    }
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const result = await db.query(
      'UPDATE products SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = TRUE RETURNING id, name',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.status(200).json({ success: true, message: 'Product deleted successfully.', product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const ordersResult = await db.query(`
      SELECT o.id, o.user_id, o.total_amount, o.status, o.payment_method,
             o.shipping_address, o.created_at,
             u.full_name, u.email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC, o.id DESC
    `);

    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await db.query(`
        SELECT id, product_id, product_name, quantity, unit_price, total_price
        FROM order_items
        WHERE order_id = $1
        ORDER BY id
      `, [order.id]);
      orders.push({ ...order, items: itemsResult.rows });
    }

    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const status = String(req.body.status || '').toLowerCase();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order ID.' });
    }
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: Confirmed, Shipped, Delivered, Cancelled.'
      });
    }

    const result = await db.query(`
      UPDATE orders
      SET status = $2
      WHERE id = $1
      RETURNING id, user_id, total_amount, status, payment_method, shipping_address, created_at
    `, [id, status]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.status(200).json({ success: true, message: 'Order status updated successfully.', order: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
