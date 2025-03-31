const Transaction = require('../models/Transaction');
const express = require('express');
const axios = require('axios');
const app = express();
const ASC = 1;
const DESC = -1;

exports.createTransaction = async (req, res) => {
  try {
    const { stockSymbol, type, fee, date, quantity, price } = req.body;
    const transaction = new Transaction({ 
      user: req.user.id, 
      stockSymbol, 
      type,
      fee,
      date: new Date(date),
      quantity, 
      price 
    });
    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ msg: error });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await getRecordsByUserId(req.user.id, DESC)
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};

exports.getPortfolio = async (req,res) => {
  try {
    const transactions = await getRecordsByUserId(req.user.id, ASC);
    const portfolio = await getFifoTransaction(transactions);
    const stockInfos = await getStockInfo(portfolio);
    const returnArray = await getSortPortfolio(portfolio, stockInfos);
    
    res.status(200).json(returnArray);
  }catch(error){
    console.error(error);
    res.status(500).json({ msg: error});
  }
};

exports.updateTransaction = async (req, res) => {
  try{
    const { stockSymbol, type, quantity, fee, price, date } = req.body;
    const transactionId = req.params.id;

    // Check if transaction exists and belongs to the logged-in user
    let transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ msg: "Transaction not found" });

    if (transaction.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: "Not authorized" });
    }

    // Update the transaction
    transaction.stockSymbol = stockSymbol || transaction.stockSymbol;
    transaction.type = type || transaction.type;
    transaction.quantity = quantity || transaction.quantity;
    transaction.fee = fee|| transaction.fee;
    transaction.price = price || transaction.price;
    transaction.date = new Date(date)||transaction.date;

    await transaction.save();
    res.json(transaction);
  }catch(error){
    console.error(error);
    res.status(500).json({ msg: error});
  }
};

getRecordsByUserId = async (id, sort)=>{
    return await Transaction.find({ user: id}).sort({ date: sort });
}

generateTrade = async (quantity, price, type, fee)=>{
  let priceWithFee = (price*quantity+fee)/quantity
  return {
    quantity,
    price: priceWithFee,
    type
  };
}

getFifoTransaction = async (transactions)=>{
  var portfolio = new Map();
    for(let i = 0; i < transactions.length; i++) {
      let {stockSymbol, type, quantity, price, fee} = transactions[i];
      let trade = await generateTrade(quantity, price, type, fee);

      if(type == "BUY") {
        let activeTrades = portfolio.get(stockSymbol);
        
        if(!activeTrades){
          portfolio.set(stockSymbol, [trade]);
        } else {
          activeTrades.push(trade);
        }
      }

      if(type == "SELL") {
        let activeTrades = portfolio.get(stockSymbol.toString());
        if (activeTrades) {
          let sharesToSell = quantity;
          while (sharesToSell > 0) {
            if(activeTrades.length > 0) {
              let itemToSell = activeTrades[0];
              itemToSell.quantity = itemToSell.quantity;

              if(itemToSell.quantity == sharesToSell) {
                sharesToSell = 0;
                activeTrades.splice(0,1);
              } else if (itemToSell.shares < sharesToSell){
                sharesToSell -= itemToSell.quantity;
                activeTrades.splice(0,1);
              } else {
                itemToSell.quantity-= sharesToSell;
                sharesToSell = 0;
              }
            }
          }

          if(activeTrades.length == 0) {
            portfolio.delete(stockSymbol);
          }
        }
      }
    }

    return portfolio;
}

getSortPortfolio = async (portfolio,stockInfos)=>{
  let portfolioSorted = new Map([...portfolio.entries()].sort());
  let returnArray = [];

  portfolioSorted.forEach((value,key)=>{
    let shares = 0;
    let totalCost = 0;
    let avgPrice = 0;
    let {name, price} = stockInfos.get(key);
    let marketValue = 0;

    value.map(trade => {
      shares += trade.quantity;
      totalCost += trade.quantity * trade.price;
      marketValue = price.amount * trade.quantity;
    });

    avgPrice = Number(totalCost / shares).toFixed(2);
    returnArray.push({stockSymbol:key, name, shares, avgPrice, currentPrice: price.amount, totalCost, marketValue}); 
  });

  return returnArray;
}

getStockInfo = async (portfolio)=>{
    let urls = [];
    let stockInfos = new Map();
    let pseUri = process.env.PSE_API_URI
    portfolio.forEach(async(value,key)=>{
      urls.push(`${pseUri}/stocks/${key}.json`)
    });
    const promises = urls.map(url => axios.get(url));
    const responses = await Promise.all(promises);
    responses.forEach(response => stockInfos.set(response.data.stock[0].symbol, response.data.stock[0]));
    return stockInfos;
}
