const express = require('express');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/', orderController.placeOrder);
router.get('/', orderController.getMyOrders);

module.exports = router;
