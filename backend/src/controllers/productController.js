const db = require('../config/db');

exports.getCategories = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT id, name, slug FROM categories ORDER BY name ASC'
    );
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getProducts = async (req, res, next) => {
  try {
    const { search, category, sort } = req.query;
    const values = [];
    const conditions = [];

    if (search && search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(`(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`);
    }

    if (category && category !== 'all') {
      values.push(category.trim());
      conditions.push(`c.slug = $${values.length}`);
    }

    conditions.push('p.is_active = TRUE');
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    let orderClause = 'ORDER BY p.is_featured DESC, p.created_at DESC';
    if (sort === 'price_asc') orderClause = 'ORDER BY p.price ASC';
    if (sort === 'price_desc') orderClause = 'ORDER BY p.price DESC';
    if (sort === 'newest') orderClause = 'ORDER BY p.created_at DESC';

    const result = await db.query(`
      SELECT
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.is_featured,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ${orderClause}
    `, values);

    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    if (!/^\d+$/.test(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const result = await db.query(`
      SELECT
        p.*,
        c.name AS category_name,
        c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = TRUE
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    next(error);
  }
};
