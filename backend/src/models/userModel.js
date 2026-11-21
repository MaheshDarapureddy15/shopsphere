const db = require('../config/db');

const UserModel = {
  async findByEmail(email) {
    const result = await db.query(
      'SELECT id, full_name, email, password_hash, phone, role, is_active, created_at FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    return result.rows[0] || null;
  },

  async findById(id) {
    const result = await db.query(
      'SELECT id, full_name, email, phone, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  async createUser({ fullName, email, passwordHash, phone = null, role = 'customer' }) {
    const result = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, phone, role, is_active, created_at`,
      [fullName.trim(), email.toLowerCase().trim(), passwordHash, phone, role]
    );
    return result.rows[0];
  }
};

module.exports = UserModel;