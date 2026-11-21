const db = require('../config/db');

const cartSelect = `
  SELECT ci.id, ci.product_id, ci.quantity,
         p.name, p.price, p.stock, p.image_url, p.is_active,
         ci.created_at, ci.updated_at
  FROM cart_items ci
  JOIN products p ON p.id = ci.product_id
  WHERE ci.user_id = $1
  ORDER BY ci.updated_at DESC
`;

exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const result = await db.query(cartSelect, [userId]);
    const cart = result.rows;
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * item.quantity,
      0
    );
    res.json({
      success: true,
      count: cart.reduce((sum, item) => sum + item.quantity, 0),
      cart,
      subtotal
    });
  } catch (error) {
    next(error);
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const productId = Number(req.body.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId is required.' });
    }

    const productResult = await db.query(
      'SELECT id, stock, is_active FROM products WHERE id = $1',
      [productId]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const product = productResult.rows[0];
    if (!product.is_active) {
      return res.status(400).json({ success: false, message: 'Product is not available.' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Product is out of stock.' });
    }

    const result = await db.query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET
        quantity = LEAST(cart_items.quantity + 1, $3),
        updated_at = CURRENT_TIMESTAMP
      RETURNING quantity
    `, [userId, productId, product.stock]);

    res.status(200).json({
      success: true,
      message: 'Added to cart.',
      quantity: result.rows[0].quantity,
      stock: product.stock
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const productId = Number(req.params.productId);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity)) {
      return res.status(400).json({ success: false, message: 'Invalid cart update.' });
    }

    const productResult = await db.query(
      'SELECT stock FROM products WHERE id = $1',
      [productId]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (quantity <= 0) {
      await db.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      return res.json({ success: true, quantity: 0, message: 'Item removed from cart.' });
    }

    const clampedQuantity = Math.min(Math.max(1, Math.floor(quantity)), productResult.rows[0].stock);
    if (clampedQuantity <= 0) {
      await db.query(
        'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
        [userId, productId]
      );
      return res.json({ success: true, quantity: 0, message: 'Item removed from cart.' });
    }

    const result = await db.query(`
      UPDATE cart_items
      SET quantity = $3, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND product_id = $2
      RETURNING quantity
    `, [userId, productId, clampedQuantity]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found.' });
    }
    res.json({ success: true, quantity: result.rows[0].quantity });
  } catch (error) {
    next(error);
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId is required.' });
    }
    await db.query(
      'DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2',
      [userId, productId]
    );
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (error) {
    next(error);
  }
};
