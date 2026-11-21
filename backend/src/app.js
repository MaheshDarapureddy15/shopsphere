const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      'https://shopsphere-brown-one.vercel.app'
    ];
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ''));
    }

    const isVercelApp = /^https:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin);
    if (allowedOrigins.includes(origin) || isVercelApp) {
      return callback(null, true);
    }

    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await db.query('SELECT NOW() AS server_time');
    res.status(200).json({
      success: true,
      message: 'ShopSphere API & PostgreSQL connected',
      environment: process.env.NODE_ENV,
      dbTime: dbResult.rows[0].server_time
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.'
  });
});

module.exports = app;
