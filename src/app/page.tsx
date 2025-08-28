'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Brain, Settings, Activity, Clock } from 'lucide-react'

interface Trade {
  id: string
  symbol: string
  type: 'buy' | 'sell'
  amount: number
  price: number
  timestamp: string
  profit: number
  mlConfidence: number
}

interface Asset {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: number
  mlPrediction: 'buy' | 'sell' | 'hold'
  confidence: number
}

interface Portfolio {
  totalValue: number
  dailyChange: number
  assets: {
    symbol: string
    amount: number
    value: number
    change: number
  }[]
}

export default function MLTradingBot() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [portfolio, setPortfolio] = useState<Portfolio>({ totalValue: 0, dailyChange: 0, assets: [] })
  const [trades, setTrades] = useState<Trade[]>([])
  const [isBotActive, setIsBotActive] = useState(false)
  const [botSettings, setBotSettings] = useState({
    riskLevel: 'medium',
    maxTradeSize: 1000,
    stopLoss: 5,
    takeProfit: 10,
    mlModel: 'lstm'
  })
  const [selectedAsset, setSelectedAsset] = useState('')
  const [tradeAmount, setTradeAmount] = useState('')
  const [mlStatus, setMlStatus] = useState('Training ML models...')

  // Simulate real-time data updates
  useEffect(() => {
    const initializeData = () => {
      // Initialize assets
      const initialAssets: Asset[] = [
        { symbol: 'BTC', name: 'Bitcoin', price: 45234.56, change24h: 2.34, volume: 2834756321, mlPrediction: 'buy', confidence: 87 },
        { symbol: 'ETH', name: 'Ethereum', price: 2345.67, change24h: -1.23, volume: 1567432198, mlPrediction: 'hold', confidence: 72 },
        { symbol: 'SOL', name: 'Solana', price: 98.76, change24h: 5.67, volume: 892345678, mlPrediction: 'buy', confidence: 91 },
        { symbol: 'ADA', name: 'Cardano', price: 0.45, change24h: -0.89, volume: 456789123, mlPrediction: 'sell', confidence: 68 },
        { symbol: 'DOT', name: 'Polkadot', price: 7.89, change24h: 3.21, volume: 234567890, mlPrediction: 'buy', confidence: 79 }
      ]
      setAssets(initialAssets)
      setSelectedAsset(initialAssets[0].symbol)

      // Initialize portfolio
      const initialPortfolio: Portfolio = {
        totalValue: 52347.89,
        dailyChange: 1234.56,
        assets: [
          { symbol: 'BTC', amount: 0.5, value: 22617.28, change: 2.34 },
          { symbol: 'ETH', amount: 3.2, value: 7506.14, change: -1.23 },
          { symbol: 'USDT', amount: 22224.47, value: 22224.47, change: 0 }
        ]
      }
      setPortfolio(initialPortfolio)

      // Initialize recent trades
      const initialTrades: Trade[] = [
        { id: '1', symbol: 'BTC', type: 'buy', amount: 0.1, price: 44500, timestamp: '2024-01-15 14:30:22', profit: 123.45, mlConfidence: 87 },
        { id: '2', symbol: 'ETH', type: 'sell', amount: 0.5, price: 2400, timestamp: '2024-01-15 13:45:11', profit: -67.89, mlConfidence: 72 },
        { id: '3', symbol: 'SOL', type: 'buy', amount: 10, price: 95, timestamp: '2024-01-15 12:20:45', profit: 37.60, mlConfidence: 91 }
      ]
      setTrades(initialTrades)
    }

    initializeData()

    // Simulate real-time price updates
    const priceInterval = setInterval(() => {
      setAssets(prev => prev.map(asset => ({
        ...asset,
        price: asset.price * (1 + (Math.random() - 0.5) * 0.002),
        change24h: asset.change24h + (Math.random() - 0.5) * 0.1
      })))

      // Update portfolio value
      setPortfolio(prev => ({
        ...prev,
        totalValue: prev.totalValue * (1 + (Math.random() - 0.5) * 0.001),
        dailyChange: prev.dailyChange * (1 + (Math.random() - 0.5) * 0.01)
      }))
    }, 3000)

    // Simulate ML status updates
    const mlInterval = setInterval(() => {
      const statuses = [
        'Analyzing market patterns...',
        'Processing historical data...',
        'Running neural networks...',
        'Generating predictions...',
        'Optimizing trading strategy...'
      ]
      setMlStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 5000)

    return () => {
      clearInterval(priceInterval)
      clearInterval(mlInterval)
    }
  }, [])

  const executeTrade = (type: 'buy' | 'sell') => {
    if (!selectedAsset || !tradeAmount) return

    const asset = assets.find(a => a.symbol === selectedAsset)
    if (!asset) return

    const amount = parseFloat(tradeAmount)
    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: selectedAsset,
      type,
      amount,
      price: asset.price,
      timestamp: new Date().toLocaleString(),
      profit: type === 'buy' ? Math.random() * 100 - 50 : Math.random() * 50,
      mlConfidence: Math.floor(Math.random() * 30) + 70
    }

    setTrades(prev => [newTrade, ...prev])
    setTradeAmount('')
  }

  const toggleBot = () => {
    setIsBotActive(!isBotActive)
  }

  const getPredictionColor = (prediction: string) => {
    switch (prediction) {
      case 'buy': return 'text-green-400'
      case 'sell': return 'text-red-400'
      default: return 'text-yellow-400'
    }
  }

  const getPredictionBadge = (prediction: string) => {
    switch (prediction) {
      case 'buy': return <Badge className="bg-green-600">BUY</Badge>
      case 'sell': return <Badge className="bg-red-600">SELL</Badge>
      default: return <Badge className="bg-yellow-600">HOLD</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Brain className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                ML Trading Bot
              </h1>
              <p className="text-gray-400">AI-Powered Trading Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">ML Status</div>
              <div className="text-sm text-blue-400">{mlStatus}</div>
            </div>
            <Button
              onClick={toggleBot}
              className={`${isBotActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isBotActive ? 'Stop Bot' : 'Start Bot'}
            </Button>
          </div>
        </div>

        {/* Portfolio Overview */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span>Portfolio Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Total Value</div>
                <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`flex items-center space-x-1 ${portfolio.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.dailyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>${Math.abs(portfolio.dailyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (24h)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Active Trades</div>
                <div className="text-2xl font-bold">{trades.length}</div>
                <div className="text-sm text-gray-400">Last 24 hours</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Bot Status</div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isBotActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={isBotActive ? 'text-green-400' : 'text-red-400'}>
                    {isBotActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">ML Model: {botSettings.mlModel.toUpperCase()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="trading" className="data-[state=active]:bg-gray-700">Trading</TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-gray-700">Assets</TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-gray-700">ML Predictions</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">History</TabsTrigger>
          </TabsList>

          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Panel */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Quick Trade</CardTitle>
                  <CardDescription>Execute trades instantly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {assets.map(asset => (
                          <SelectItem key={asset.symbol} value={asset.symbol}>
                            {asset.symbol} - {asset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => executeTrade('buy')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!selectedAsset || !tradeAmount}
                    >
                      Buy
                    </Button>
                    <Button
                      onClick={() => executeTrade('sell')}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!selectedAsset || !tradeAmount}
                    >
                      Sell
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bot Settings */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Bot Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select value={botSettings.riskLevel} onValueChange={(value) => setBotSettings(prev => ({ ...prev, riskLevel: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Trade Size: ${botSettings.maxTradeSize}</Label>
                    <Input
                      type="range"
                      min="100"
                      max="10000"
                      step="100"
                      value={botSettings.maxTradeSize}
                      onChange={(e) => setBotSettings(prev => ({ ...prev, maxTradeSize: parseInt(e.target.value) }))}
                      className="bg-gray-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stop Loss: {botSettings.stopLoss}%</Label>
                      <Input
                        type="range"
                        min="1"
                        max="20"
                        value={botSettings.stopLoss}
                        onChange={(e) => setBotSettings(prev => ({ ...prev, stopLoss: parseInt(e.target.value) }))}
                        className="bg-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Take Profit: {botSettings.takeProfit}%</Label>
                      <Input
                        type="range"
                        min="1"
                        max="50"
                        value={botSettings.takeProfit}
                        onChange={(e) => setBotSettings(prev => ({ ...prev, takeProfit: parseInt(e.target.value) }))}
                        className="bg-gray-700"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Market Assets</CardTitle>
                <CardDescription>Real-time asset prices and ML predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assets.map(asset => (
                    <div key={asset.symbol} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold">
                          {asset.symbol}
                        </div>
                        <div>
                          <div className="font-semibold">{asset.name}</div>
                          <div className="text-sm text-gray-400">{asset.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div className={`flex items-center justify-end space-x-1 ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {asset.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          <span className="text-sm">{Math.abs(asset.change24h).toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">ML Prediction</div>
                        <div className="flex items-center space-x-2">
                          {getPredictionBadge(asset.mlPrediction)}
                          <span className={`text-sm ${getPredictionColor(asset.mlPrediction)}`}>
                            {asset.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Volume</div>
                        <div className="text-sm">${(asset.volume / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-400" />
                    <span>ML Model Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Prediction Accuracy</span>
                        <span>87.3%</span>
                      </div>
                      <Progress value={87.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Profit Factor</span>
                        <span>2.34</span>
                      </div>
                      <Progress value={76.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Win Rate</span>
                        <span>73.5%</span>
                      </div>
                      <Progress value={73.5} className="h-2" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Model Information</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• LSTM Neural Network</div>
                      <div>• Training data: 2 years</div>
                      <div>• Features: 45 technical indicators</div>
                      <div>• Update frequency: Every 5 minutes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Current Predictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assets.map(asset => (
                      <div key={asset.symbol} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">{asset.symbol}</span>
                          {getPredictionBadge(asset.mlPrediction)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Confidence</span>
                            <span>{asset.confidence}%</span>
                          </div>
                          <Progress value={asset.confidence} className="h-1" />
                          <div className="text-xs text-gray-400">
                            Expected move: {asset.mlPrediction === 'buy' ? '+' : asset.mlPrediction === 'sell' ? '-' : '±'}
                            {Math.abs(asset.change24h * 0.8).toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Trading History</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {trades.map(trade => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {trade.type === 'buy' ? 'B' : 'S'}
                          </div>
                          <div>
                            <div className="font-semibold">{trade.symbol}</div>
                            <div className="text-sm text-gray-400 flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{trade.timestamp}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">${trade.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          <div className="text-sm text-gray-400">{trade.amount} units</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">ML: {trade.mlConfidence}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}