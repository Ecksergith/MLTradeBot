import { NextRequest, NextResponse } from 'next/server'

interface MarketData {
  symbol: string
  name: string
  price: number
  change_24h: number
  change_percent_24h: number
  volume_24h: number
  market_cap: number
  high_24h: number
  low_24h: number
  last_updated: string
}

interface HistoricalData {
  symbol: string
  interval: string
  data: Array<{
    timestamp: string
    open: number
    high: number
    low: number
    close: number
    volume: number
  }>
}

// Mock market data for popular cryptocurrencies
const mockMarketData: MarketData[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 45234.56,
    change_24h: 1056.78,
    change_percent_24h: 2.39,
    volume_24h: 2834756321,
    market_cap: 885678901234,
    high_24h: 46123.45,
    low_24h: 43987.32,
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2345.67,
    change_24h: -28.90,
    change_percent_24h: -1.22,
    volume_24h: 1567432198,
    market_cap: 281234567890,
    high_24h: 2412.34,
    low_24h: 2298.76,
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 98.76,
    change_24h: 5.67,
    change_percent_24h: 6.09,
    volume_24h: 892345678,
    market_cap: 42345678901,
    high_24h: 102.34,
    low_24h: 92.45,
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'ADA',
    name: 'Cardano',
    price: 0.45,
    change_24h: -0.004,
    change_percent_24h: -0.88,
    volume_24h: 456789123,
    market_cap: 15678901234,
    high_24h: 0.46,
    low_24h: 0.44,
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'DOT',
    name: 'Polkadot',
    price: 7.89,
    change_24h: 0.25,
    change_percent_24h: 3.27,
    volume_24h: 234567890,
    market_cap: 9876543210,
    high_24h: 8.12,
    low_24h: 7.54,
    last_updated: new Date().toISOString()
  }
]

function generateHistoricalData(symbol: string, interval: string = '1h', limit: number = 24): HistoricalData {
  const marketData = mockMarketData.find(data => data.symbol === symbol)
  if (!marketData) {
    throw new Error('Symbol not found')
  }
  
  const data = []
  let currentPrice = marketData.price - marketData.change_24h
  
  for (let i = limit; i >= 0; i--) {
    const timestamp = new Date(Date.now() - i * (interval === '1h' ? 3600000 : 86400000))
    
    // Generate realistic price movements
    const volatility = 0.02 // 2% volatility
    const change = (Math.random() - 0.5) * volatility
    currentPrice = currentPrice * (1 + change)
    
    const high = currentPrice * (1 + Math.random() * 0.01)
    const low = currentPrice * (1 - Math.random() * 0.01)
    const open = i === limit ? currentPrice : data[data.length - 1].close
    const close = currentPrice
    const volume = Math.random() * 1000000 + 500000
    
    data.push({
      timestamp: timestamp.toISOString(),
      open: Math.max(open, low),
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close: close,
      volume: volume
    })
  }
  
  return {
    symbol,
    interval,
    data
  }
}

function calculateMarketSummary(): {
  total_market_cap: number
  total_volume_24h: number
  btc_dominance: number
  top_gainers: Array<{ symbol: string; change_percent: number }>
  top_losers: Array<{ symbol: string; change_percent: number }>
} {
  const totalMarketCap = mockMarketData.reduce((sum, data) => sum + data.market_cap, 0)
  const totalVolume = mockMarketData.reduce((sum, data) => sum + data.volume_24h, 0)
  
  const btcMarketCap = mockMarketData.find(data => data.symbol === 'BTC')?.market_cap || 0
  const btcDominance = (btcMarketCap / totalMarketCap) * 100
  
  const sortedByChange = [...mockMarketData].sort((a, b) => b.change_percent_24h - a.change_percent_24h)
  const topGainers = sortedByChange.slice(0, 3).map(data => ({
    symbol: data.symbol,
    change_percent: data.change_percent_24h
  }))
  
  const topLosers = sortedByChange.slice(-3).map(data => ({
    symbol: data.symbol,
    change_percent: data.change_percent_24h
  }))
  
  return {
    total_market_cap: totalMarketCap,
    total_volume_24h: totalVolume,
    btc_dominance: btcDominance,
    top_gainers: topGainers,
    top_losers: topLosers
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const historical = searchParams.get('historical')
    const interval = searchParams.get('interval') || '1h'
    const limit = parseInt(searchParams.get('limit') || '24')
    
    if (historical === 'true' && symbol) {
      // Return historical data for a specific symbol
      const historicalData = generateHistoricalData(symbol, interval, limit)
      return NextResponse.json(historicalData)
    }
    
    if (symbol) {
      // Return data for a specific symbol
      const marketData = mockMarketData.find(data => data.symbol === symbol)
      if (!marketData) {
        return NextResponse.json(
          { error: 'Symbol not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(marketData)
    }
    
    // Return all market data with summary
    const marketSummary = calculateMarketSummary()
    
    return NextResponse.json({
      data: mockMarketData,
      summary: marketSummary,
      last_updated: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Market data API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Simulate real-time price updates
export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json()
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      )
    }
    
    // Update prices with small random changes
    const updatedData = mockMarketData
      .filter(data => symbols.includes(data.symbol))
      .map(data => {
        const changePercent = (Math.random() - 0.5) * 0.5 // ±0.5% change
        const newPrice = data.price * (1 + changePercent / 100)
        const newChange24h = data.change_24h + (newPrice - data.price)
        const newChangePercent24h = (newChange24h / (data.price - data.change_24h)) * 100
        
        return {
          ...data,
          price: newPrice,
          change_24h: newChange24h,
          change_percent_24h: newChangePercent24h,
          last_updated: new Date().toISOString()
        }
      })
    
    return NextResponse.json({
      updated_data: updatedData,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Price update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}