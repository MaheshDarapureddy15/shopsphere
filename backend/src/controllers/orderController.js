const { pool } = require('../config/db');

exports.placeOrder = async (req, res, next) => {
  const userId = req.user?.id || req.user?.userId || req.userId;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authorized.' });
  }
  const shippingAddress = typeof req.body.shippingAddress === 'string'
    ? req.body.shippingAddress.trim()
    : '';
  const paymentMethod = typeof req.body.paymentMethod === 'string'
    ? req.body.paymentMethod.trim().toUpperCase()
    : '';

  if (!shippingAddress) {
    return res.status(400).json({ success: false, message: 'Shipping address is required.' });
  }
  if (!['UPI', 'CARD', 'COD'].includes(paymentMethod)) {
    return res.status(400).json({ success: false, message: 'Payment method must be UPI, Card, or COD.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cartResult = await client.query(`
      SELECT ci.product_id, ci.quantity,
             p.name AS product_name, p.price AS unit_price, p.stock, p.is_active
      FROM cart_items ci
      JOIN products p ON p.id = ci.product_id
      WHERE ci.user_id = $1
      ORDER BY ci.id
      FOR UPDATE OF p
    `, [userId]);

    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    for (const item of cartResult.rows) {
      if (!item.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: `${item.product_name} is no longer available.`
        });
      }
      if (item.quantity > item.stock) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          success: false,
          message: `Insufficient stock for ${item.product_name}.`
        });
      }
    }

    const totalAmount = cartResult.rows.reduce(
      (sum, item) => sum + Number(item.unit_price) * item.quantity,
      0
    );

    const orderResult = await client.query(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address)
      VALUES ($1, $2, 'pending', $3, $4)
      RETURNING id, total_amount, status, payment_method, shipping_address, created_at
    `, [userId, totalAmount.toFixed(2), paymentMethod, shippingAddress]);

    const order = orderResult.rows[0];

    for (const item of cartResult.rows) {
      await client.query(`
        INSERT INTO order_items (
          order_id, product_id, product_name, quantity, unit_price, total_price
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        order.id,
        item.product_id,
        item.product_name,
        item.quantity,
        Number(item.unit_price).toFixed(2),
        (Number(item.unit_price) * item.quantity).toFixed(2)
      ]);

      await client.query(
        'UPDATE products SET stock = stock - $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [item.product_id, item.quantity]
      );
    }

    await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const ordersResult = await pool.query(`
      SELECT id, total_amount, status, payment_method, shipping_address, created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC, id DESC
    `, [userId]);

    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await pool.query(`
        SELECT id, product_id, product_name, quantity, unit_price
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
