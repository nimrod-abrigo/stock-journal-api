const express = require('express');
const { createTransaction, createTransactionMany, getTransactions, getPortfolio, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createTransaction);
router.post('/many', authMiddleware, createTransactionMany);
router.get('/', authMiddleware, getTransactions);
router.get('/portfolio', authMiddleware, getPortfolio);
router.put('/:id', authMiddleware, updateTransaction);
router.delete('/:id', authMiddleware, deleteTransaction);

module.exports = router;