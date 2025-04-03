const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stockSymbol: { type: String, required: true },
  type: { type: String, enum: ['BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  fee: { type: Number, required: true },
  date: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);