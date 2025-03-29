const express = require('express');
const { createTransaction, getTransactions, getPortfolio, updateTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createTransaction);
router.get('/', authMiddleware, getTransactions);
router.get('/portfolio', authMiddleware, getPortfolio);
router.put('/:id', authMiddleware, updateTransaction);

module.exports = router;