const db = require('../config/db');

exports.getWishlist = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const result = await db.query(`
      SELECT wi.id, wi.product_id, wi.created_at,
             p.name, p.price, p.stock, p.image_url, p.is_active
      FROM wishlist_items wi
      JOIN products p ON p.id = wi.product_id
      WHERE wi.user_id = $1
      ORDER BY wi.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      count: result.rows.length,
      wishlist: result.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
    const productId = Number(req.body.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ success: false, message: 'Valid productId is required.' });
    }

    const product = await db.query(
      'SELECT id FROM products WHERE id = $1 AND is_active = TRUE',
      [productId]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const removed = await db.query(
      'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2 RETURNING id',
      [userId, productId]
    );
    if (removed.rows.length > 0) {
      return res.json({ success: true, added: false, message: 'Removed from wishlist.' });
    }

    await db.query(
      'INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)',
      [userId, productId]
    );
    res.status(200).json({ success: true, added: true, message: 'Added to wishlist.' });
  } catch (error) {
    next(error);
  }
};
