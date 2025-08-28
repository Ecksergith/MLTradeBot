import { NextRequest, NextResponse } from 'next/server'

interface TradeRequest {
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price?: number
  ml_confidence?: number
}

interface TradeResponse {
  success: boolean
  trade_id: string
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: string
  estimated_profit?: number
  fees: number
  status: 'executed' | 'pending' | 'failed'
  message: string
}

// Mock current prices (in a real app, this would come from a market data feed)
const mockPrices: Record<string, number> = {
  'BTC': 45234.56,
  'ETH': 2345.67,
  'SOL': 98.76,
  'ADA': 0.45,
  'DOT': 7.89
}

// Mock portfolio balances (in a real app, this would come from a database)
const mockPortfolio: Record<string, number> = {
  'USD': 10000,
  'BTC': 0.5,
  'ETH': 3.2,
  'SOL': 10,
  'ADA': 1000,
  'DOT': 50
}

function calculateFees(amount: number): number {
  // Calculate trading fees (0.1% for this example)
  return amount * 0.001
}

function validateTrade(trade: TradeRequest): { valid: boolean; message: string } {
  // Check if symbol exists
  if (!mockPrices[trade.symbol]) {
    return { valid: false, message: 'Invalid trading symbol' }
  }
  
  // Check if amount is positive
  if (trade.amount <= 0) {
    return { valid: false, message: 'Trade amount must be positive' }
  }
  
  // Check if user has sufficient balance
  const currentPrice = mockPrices[trade.symbol]
  
  if (trade.type === 'buy') {
    const totalCost = trade.amount + calculateFees(trade.amount)
    if (mockPortfolio['USD'] < totalCost) {
      return { valid: false, message: 'Insufficient USD balance' }
    }
  } else {
    const assetAmount = trade.amount / currentPrice
    if ((mockPortfolio[trade.symbol] || 0) < assetAmount) {
      return { valid: false, message: `Insufficient ${trade.symbol} balance` }
    }
  }
  
  return { valid: true, message: 'Trade validation successful' }
}

function executeTrade(trade: TradeRequest): TradeResponse {
  const validation = validateTrade(trade)
  
  if (!validation.valid) {
    return {
      success: false,
      trade_id: '',
      symbol: trade.symbol,
      type: trade.type,
      amount: trade.amount,
      price: 0,
      timestamp: new Date().toISOString(),
      fees: 0,
      status: 'failed',
      message: validation.message
    }
  }
  
  const currentPrice = mockPrices[trade.symbol]
  const fees = calculateFees(trade.amount)
  const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Simulate trade execution with slight price slippage
  const executionPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.002)
  
  // Calculate estimated profit (simplified for demo)
  let estimatedProfit = 0
  if (trade.ml_confidence && trade.ml_confidence > 70) {
    // Higher confidence trades have better expected outcomes
    const profitMultiplier = (trade.ml_confidence - 70) / 30
    estimatedProfit = trade.amount * 0.02 * profitMultiplier * (trade.type === 'buy' ? 1 : -1)
  }
  
  // Update portfolio (in a real app, this would update the database)
  if (trade.type === 'buy') {
    mockPortfolio['USD'] -= (trade.amount + fees)
    mockPortfolio[trade.symbol] = (mockPortfolio[trade.symbol] || 0) + (trade.amount / executionPrice)
  } else {
    const assetAmount = trade.amount / executionPrice
    mockPortfolio[trade.symbol] -= assetAmount
    mockPortfolio['USD'] += (trade.amount - fees)
  }
  
  return {
    success: true,
    trade_id: tradeId,
    symbol: trade.symbol,
    type: trade.type,
    amount: trade.amount,
    price: executionPrice,
    timestamp: new Date().toISOString(),
    estimated_profit: estimatedProfit,
    fees: fees,
    status: 'executed',
    message: `Trade executed successfully at $${executionPrice.toFixed(2)}`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { symbol, type, amount, price, ml_confidence }: TradeRequest = body
    
    // Validate required fields
    if (!symbol || !type || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, type, amount' },
        { status: 400 }
      )
    }
    
    // Validate trade type
    if (!['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid trade type. Must be "buy" or "sell"' },
        { status: 400 }
      )
    }
    
    // Execute the trade
    const result = executeTrade({
      symbol,
      type,
      amount: parseFloat(amount.toString()),
      price: price ? parseFloat(price.toString()) : undefined,
      ml_confidence: ml_confidence ? parseFloat(ml_confidence.toString()) : undefined
    })
    
    // Log the trade (in a real app, this would be stored in a database)
    console.log('Trade executed:', result)
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Trade execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error during trade execution' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Return current portfolio status and available trading pairs
    return NextResponse.json({
      portfolio: mockPortfolio,
      available_pairs: Object.keys(mockPrices),
      current_prices: mockPrices,
      trading_fees: '0.1%',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Portfolio fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}