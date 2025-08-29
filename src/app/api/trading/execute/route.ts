import { NextRequest, NextResponse } from 'next/server'
import { addOpenTrade } from '../close/route'
import { mockPrices, mockPortfolio, calculateFees, validateTrade, executeTradeOnPortfolio } from '@/lib/portfolio'

interface TradeRequest {
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price?: number
  ml_confidence?: number
  take_profit?: number
  stop_loss?: number
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

function executeTrade(trade: TradeRequest): TradeResponse {
  const validation = validateTrade(trade, mockPortfolio, mockPrices)
  
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
  
  // Update portfolio using shared function
  const { updatedPortfolio } = executeTradeOnPortfolio({
    symbol: trade.symbol,
    type: trade.type,
    amount: trade.amount,
    price: executionPrice
  }, mockPortfolio)
  
  // Update the shared portfolio (in a real app, this would update the database)
  Object.assign(mockPortfolio, updatedPortfolio)
  
  // Add to open trades tracking
  const tradeData = {
    trade_id: tradeId,
    symbol: trade.symbol,
    type: trade.type,
    amount: trade.amount,
    price: executionPrice,
    timestamp: new Date().toISOString(),
    ml_confidence: trade.ml_confidence || 70,
    take_profit: trade.take_profit,
    stop_loss: trade.stop_loss
  }
  
  addOpenTrade(tradeData)
  
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
    const { symbol, type, amount, price, ml_confidence, take_profit, stop_loss }: TradeRequest = body
    
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
      ml_confidence: ml_confidence ? parseFloat(ml_confidence.toString()) : undefined,
      take_profit: take_profit ? parseFloat(take_profit.toString()) : undefined,
      stop_loss: stop_loss ? parseFloat(stop_loss.toString()) : undefined
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