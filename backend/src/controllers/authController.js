const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const UserModel = require('../models/userModel');

const sendTokenCookie = (res, user, statusCode, message) => {
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(statusCode).json({
    success: true,
    message,
    token,
    user: {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
};

const AuthController = {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { full_name, email, password, phone } = req.body;

      if (!full_name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full name, email, and password are required.'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await UserModel.createUser({
        fullName: full_name,
        email,
        passwordHash,
        phone
      });

      sendTokenCookie(res, newUser, 201, 'Account registered successfully.');
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Registration failed.',
        error: error.message
      });
    }
  },

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required.'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      sendTokenCookie(res, user, 200, 'Logged in successfully.');
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Login failed.',
        error: error.message
      });
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res) {
    try {
      const email = String(req.body.email || '').trim().toLowerCase();
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required.'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account exists with this email.'
        });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      await db.query(
        `UPDATE users
         SET reset_token_hash = $1,
             reset_token_expires = NOW() + INTERVAL '15 minutes',
             updated_at = NOW()
         WHERE id = $2`,
        [resetTokenHash, user.id]
      );

      const resetUrl = `http://localhost:5500/auth.html?resetToken=${resetToken}`;
      console.log(`Password reset URL: ${resetUrl}`);

      return res.status(200).json({
        success: true,
        message: 'Password reset token generated.',
        resetToken
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Could not generate a password reset token.',
        error: error.message
      });
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Reset token is required.'
        });
      }
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long.'
        });
      }

      const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const result = await db.query(
        `SELECT id FROM users
         WHERE reset_token_hash = $1
           AND reset_token_expires > NOW()`,
        [resetTokenHash]
      );

      if (!result.rows[0]) {
        return res.status(400).json({
          success: false,
          message: 'Reset token is invalid or has expired.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await db.query(
        `UPDATE users
         SET password_hash = $1,
             reset_token_hash = NULL,
             reset_token_expires = NULL,
             updated_at = NOW()
         WHERE id = $2`,
        [passwordHash, result.rows[0].id]
      );

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully. You can now log in.'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Could not reset password.',
        error: error.message
      });
    }
  },

  // POST /api/auth/logout
  logout(req, res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  },

  // GET /api/auth/me
  getMe(req, res) {
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
};

module.exports = AuthController;