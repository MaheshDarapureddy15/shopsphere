const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/categories', productController.getCategories);
router.get('/products', productController.getProducts);
router.get('/products/:id', productController.getProductById);

module.exports = router;
