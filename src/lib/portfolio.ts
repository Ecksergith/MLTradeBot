// Shared portfolio state that can be imported by multiple API routes

// Mock current prices (in a real app, this would come from a market data feed)
export const mockPrices: Record<string, number> = {
  'BTC': 45234.56,
  'ETH': 2345.67,
  'SOL': 98.76,
  'ADA': 0.45,
  'DOT': 7.89
}

// Shared portfolio balances (in a real app, this would come from a database)
export const mockPortfolio: Record<string, number> = {
  'USD': 10000,
  'BTC': 0.5,
  'ETH': 3.2,
  'SOL': 10,
  'ADA': 1000,
  'DOT': 50
}

// Function to calculate portfolio total value
export function calculatePortfolioValue(portfolio: Record<string, number>, prices: Record<string, number>): number {
  return Object.entries(portfolio).reduce((sum: number, [symbol, amount]: [string, any]) => {
    if (symbol === 'USD') return sum + amount
    const price = prices[symbol] || 0
    return sum + (amount * price)
  }, 0)
}

// Function to calculate fees
export function calculateFees(amount: number): number {
  // Calculate trading fees (0.1% for this example)
  return amount * 0.001
}

// Function to validate trade
export function validateTrade(trade: {
  symbol: string
  type: 'buy' | 'sell'
  amount: number
}, portfolio: Record<string, number>, prices: Record<string, number>): { valid: boolean; message: string } {
  // Check if symbol exists
  if (!prices[trade.symbol]) {
    return { valid: false, message: 'Invalid trading symbol' }
  }
  
  // Check if amount is positive
  if (trade.amount <= 0) {
    return { valid: false, message: 'Trade amount must be positive' }
  }
  
  // Check if user has sufficient balance
  const currentPrice = prices[trade.symbol]
  
  if (trade.type === 'buy') {
    const totalCost = trade.amount + calculateFees(trade.amount)
    if (portfolio['USD'] < totalCost) {
      return { valid: false, message: 'Insufficient USD balance' }
    }
  } else {
    const assetAmount = trade.amount / currentPrice
    if ((portfolio[trade.symbol] || 0) < assetAmount) {
      return { valid: false, message: `Insufficient ${trade.symbol} balance` }
    }
  }
  
  return { valid: true, message: 'Trade validation successful' }
}

// Function to execute trade on portfolio
export function executeTradeOnPortfolio(trade: {
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
}, portfolio: Record<string, number>): { updatedPortfolio: Record<string, number>; fees: number } {
  const fees = calculateFees(trade.amount)
  const updatedPortfolio = { ...portfolio }
  
  if (trade.type === 'buy') {
    updatedPortfolio['USD'] -= (trade.amount + fees)
    updatedPortfolio[trade.symbol] = (updatedPortfolio[trade.symbol] || 0) + (trade.amount / trade.price)
  } else {
    const assetAmount = trade.amount / trade.price
    updatedPortfolio[trade.symbol] -= assetAmount
    updatedPortfolio['USD'] += (trade.amount - fees)
  }
  
  return { updatedPortfolio, fees }
}

// Function to close trade on portfolio
export function closeTradeOnPortfolio(trade: {
  symbol: string
  type: 'buy' | 'sell'
  quantity: number
  price: number
  closePrice: number
}, portfolio: Record<string, number>): { updatedPortfolio: Record<string, number>; fees: number; realizedPnL: number } {
  const fees = calculateFees(trade.quantity * trade.closePrice)
  const updatedPortfolio = { ...portfolio }
  let realizedPnL = 0
  
  if (trade.type === 'buy') {
    // For buy trades: (close_price - entry_price) * quantity - fees
    realizedPnL = (trade.closePrice - trade.price) * trade.quantity - fees
    updatedPortfolio[trade.symbol] -= trade.quantity
    updatedPortfolio['USD'] += (trade.closePrice * trade.quantity) - fees
  } else {
    // For sell trades: (entry_price - close_price) * quantity - fees
    realizedPnL = (trade.price - trade.closePrice) * trade.quantity - fees
    updatedPortfolio['USD'] -= (trade.closePrice * trade.quantity) + fees
    updatedPortfolio[trade.symbol] += trade.quantity
  }
  
  // Ensure minimum PnL calculation to avoid zero values when there's actual price difference
  if (Math.abs(realizedPnL) < 0.01 && trade.closePrice !== trade.price) {
    const priceDifference = Math.abs(trade.closePrice - trade.price)
    const basePnL = priceDifference * trade.quantity - fees
    
    // Apply correct sign based on trade type and price movement
    if (trade.type === 'buy') {
      // Buy trade: profit when closePrice > price, loss when closePrice < price
      realizedPnL = trade.closePrice > trade.price ? 
        Math.max(0.01, basePnL) : 
        Math.min(-0.01, -basePnL)
    } else {
      // Sell trade: profit when price > closePrice, loss when price < closePrice
      realizedPnL = trade.price > trade.closePrice ? 
        Math.max(0.01, basePnL) : 
        Math.min(-0.01, -basePnL)
    }
  }
  
  return { updatedPortfolio, fees, realizedPnL }
}