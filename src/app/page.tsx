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
  const [isAutoTradeEnabled, setIsAutoTradeEnabled] = useState(false)
  const [autoTradeSettings, setAutoTradeSettings] = useState({
    enabledAssets: ['BTC', 'ETH', 'SOL'],
    minConfidence: 75,
    maxDailyTrades: 10,
    tradeInterval: 30, // segundos
    riskMultiplier: 1.0
  })
  const [botSettings, setBotSettings] = useState({
    riskLevel: 'medium',
    maxTradeSize: 1000,
    stopLoss: 5,
    takeProfit: 10,
    mlModel: 'lstm'
  })
  const [selectedAsset, setSelectedAsset] = useState('')
  const [tradeAmount, setTradeAmount] = useState('')
  const [mlStatus, setMlStatus] = useState('Treinando modelos ML...')

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
        'Analisando padrões de mercado...',
        'Processando dados históricos...',
        'Executando redes neurais...',
        'Gerando previsões...',
        'Otimizando estratégia de trading...'
      ]
      setMlStatus(statuses[Math.floor(Math.random() * statuses.length)])
    }, 5000)

    // Auto trading logic
    const autoTradeInterval = setInterval(() => {
      if (isBotActive && isAutoTradeEnabled) {
        executeAutoTrade()
      }
    }, autoTradeSettings.tradeInterval * 1000)

    return () => {
      clearInterval(priceInterval)
      clearInterval(mlInterval)
      clearInterval(autoTradeInterval)
    }
  }, [isBotActive, isAutoTradeEnabled, autoTradeSettings.tradeInterval])

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

  const executeAutoTrade = () => {
    // Check daily trade limit
    const today = new Date().toDateString()
    const todayTrades = trades.filter(trade => 
      new Date(trade.timestamp).toDateString() === today
    )
    
    if (todayTrades.length >= autoTradeSettings.maxDailyTrades) {
      return
    }

    // Find assets that meet auto trade criteria
    const eligibleAssets = assets.filter(asset => 
      autoTradeSettings.enabledAssets.includes(asset.symbol) &&
      asset.confidence >= autoTradeSettings.minConfidence &&
      asset.mlPrediction !== 'hold'
    )

    if (eligibleAssets.length === 0) return

    // Select the asset with highest confidence
    const selectedAsset = eligibleAssets.reduce((prev, current) => 
      current.confidence > prev.confidence ? current : prev
    )

    // Calculate trade amount based on risk settings
    const baseAmount = botSettings.maxTradeSize * autoTradeSettings.riskMultiplier
    const riskMultiplier = botSettings.riskLevel === 'low' ? 0.5 : 
                          botSettings.riskLevel === 'medium' ? 1.0 : 1.5
    const tradeAmount = baseAmount * riskMultiplier

    const newTrade: Trade = {
      id: Date.now().toString(),
      symbol: selectedAsset.symbol,
      type: selectedAsset.mlPrediction,
      amount: tradeAmount,
      price: selectedAsset.price,
      timestamp: new Date().toLocaleString(),
      profit: selectedAsset.mlPrediction === 'buy' ? 
        Math.random() * 100 - 30 : Math.random() * 80 - 30,
      mlConfidence: selectedAsset.confidence
    }

    setTrades(prev => [newTrade, ...prev])

    // Update portfolio
    setPortfolio(prev => ({
      ...prev,
      totalValue: prev.totalValue + (newTrade.profit || 0),
      dailyChange: prev.dailyChange + (newTrade.profit || 0)
    }))
  }

  const toggleBot = () => {
    setIsBotActive(!isBotActive)
  }

  const toggleAutoTrade = () => {
    setIsAutoTradeEnabled(!isAutoTradeEnabled)
  }

  const updateAutoTradeSetting = (key: string, value: any) => {
    setAutoTradeSettings(prev => ({ ...prev, [key]: value }))
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
      case 'buy': return <Badge className="bg-green-600">COMPRAR</Badge>
      case 'sell': return <Badge className="bg-red-600">VENDER</Badge>
      default: return <Badge className="bg-yellow-600">MANTER</Badge>
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
                Bot de Trading ML
              </h1>
              <p className="text-gray-400">Plataforma de Trading com Inteligência Artificial</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Status ML</div>
              <div className="text-sm text-blue-400">{mlStatus}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={toggleAutoTrade}
                className={`${isAutoTradeEnabled ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                disabled={!isBotActive}
              >
                {isAutoTradeEnabled ? 'Auto Trade ON' : 'Auto Trade OFF'}
              </Button>
              <Button
                onClick={toggleBot}
                className={`${isBotActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {isBotActive ? 'Parar Bot' : 'Iniciar Bot'}
              </Button>
            </div>
          </div>
        </div>

        {/* Portfolio Overview */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span>Visão Geral do Portfólio</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Valor Total</div>
                <div className="text-2xl font-bold">${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className={`flex items-center space-x-1 ${portfolio.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolio.dailyChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span>${Math.abs(portfolio.dailyChange).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (24h)</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Trades Ativos</div>
                <div className="text-2xl font-bold">{trades.length}</div>
                <div className="text-sm text-gray-400">Últimas 24 horas</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Status do Bot</div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isBotActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  <span className={isBotActive ? 'text-green-400' : 'text-red-400'}>
                    {isBotActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="text-sm text-gray-400">Modelo ML: {botSettings.mlModel.toUpperCase()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="trading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800">
            <TabsTrigger value="trading" className="data-[state=active]:bg-gray-700">Trading</TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-gray-700">Ativos</TabsTrigger>
            <TabsTrigger value="predictions" className="data-[state=active]:bg-gray-700">Previsões ML</TabsTrigger>
            <TabsTrigger value="autotrade" className="data-[state=active]:bg-gray-700">Auto Trade</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gray-700">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="trading" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trading Panel */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Trade Rápido</CardTitle>
                  <CardDescription>Execute trades instantaneamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="asset">Ativo</Label>
                    <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue placeholder="Selecione o ativo" />
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
                    <Label htmlFor="amount">Valor (USD)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={tradeAmount}
                      onChange={(e) => setTradeAmount(e.target.value)}
                      placeholder="Digite o valor"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => executeTrade('buy')}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!selectedAsset || !tradeAmount}
                    >
                      Comprar
                    </Button>
                    <Button
                      onClick={() => executeTrade('sell')}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={!selectedAsset || !tradeAmount}
                    >
                      Vender
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bot Settings */}
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configurações do Bot</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nível de Risco</Label>
                    <Select value={botSettings.riskLevel} onValueChange={(value) => setBotSettings(prev => ({ ...prev, riskLevel: value }))}>
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tamanho Máximo do Trade: ${botSettings.maxTradeSize}</Label>
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
                <CardTitle>Ativos do Mercado</CardTitle>
                <CardDescription>Preços de ativos em tempo real e previsões ML</CardDescription>
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
                        <div className="text-sm text-gray-400">Previsão ML</div>
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
                    <span>Performance do Modelo ML</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Acurácia da Previsão</span>
                        <span>87.3%</span>
                      </div>
                      <Progress value={87.3} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Fator de Lucro</span>
                        <span>2.34</span>
                      </div>
                      <Progress value={76.8} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taxa de Acerto</span>
                        <span>73.5%</span>
                      </div>
                      <Progress value={73.5} className="h-2" />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Informações do Modelo</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• Rede Neural LSTM</div>
                      <div>• Dados de treinamento: 2 anos</div>
                      <div>• Features: 45 indicadores técnicos</div>
                      <div>• Frequência de atualização: A cada 5 minutos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Previsões Atuais</CardTitle>
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
                            <span>Confiança</span>
                            <span>{asset.confidence}%</span>
                          </div>
                          <Progress value={asset.confidence} className="h-1" />
                          <div className="text-xs text-gray-400">
                            Movimento esperado: {asset.mlPrediction === 'buy' ? '+' : asset.mlPrediction === 'sell' ? '-' : '±'}
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

          <TabsContent value="autotrade" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configurações de Auto Trade</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ativos Habilitados</Label>
                    <div className="space-y-2">
                      {['BTC', 'ETH', 'SOL', 'ADA', 'DOT'].map(asset => (
                        <div key={asset} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={autoTradeSettings.enabledAssets.includes(asset)}
                            onChange={(e) => {
                              const newAssets = e.target.checked
                                ? [...autoTradeSettings.enabledAssets, asset]
                                : autoTradeSettings.enabledAssets.filter(a => a !== asset)
                              updateAutoTradeSetting('enabledAssets', newAssets)
                            }}
                            className="rounded border-gray-600 bg-gray-700"
                          />
                          <Label>{asset}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Confiança Mínima: {autoTradeSettings.minConfidence}%</Label>
                    <Input
                      type="range"
                      min="50"
                      max="95"
                      value={autoTradeSettings.minConfidence}
                      onChange={(e) => updateAutoTradeSetting('minConfidence', parseInt(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Máximo de Trades por Dia: {autoTradeSettings.maxDailyTrades}</Label>
                    <Input
                      type="range"
                      min="1"
                      max="50"
                      value={autoTradeSettings.maxDailyTrades}
                      onChange={(e) => updateAutoTradeSetting('maxDailyTrades', parseInt(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Intervalo entre Trades: {autoTradeSettings.tradeInterval}s</Label>
                    <Input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={autoTradeSettings.tradeInterval}
                      onChange={(e) => updateAutoTradeSetting('tradeInterval', parseInt(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Multiplicador de Risco: {autoTradeSettings.riskMultiplier}x</Label>
                    <Input
                      type="range"
                      min="0.1"
                      max="3.0"
                      step="0.1"
                      value={autoTradeSettings.riskMultiplier}
                      onChange={(e) => updateAutoTradeSetting('riskMultiplier', parseFloat(e.target.value))}
                      className="bg-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Status do Auto Trade</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge className={isAutoTradeEnabled ? 'bg-green-600' : 'bg-gray-600'}>
                        {isAutoTradeEnabled ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Bot Principal</span>
                      <Badge className={isBotActive ? 'bg-green-600' : 'bg-red-600'}>
                        {isBotActive ? 'ATIVO' : 'INATIVO'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Ativos Monitorados</span>
                      <span>{autoTradeSettings.enabledAssets.length}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Trades Hoje</span>
                      <span>{trades.filter(t => new Date(t.timestamp).toDateString() === new Date().toDateString()).length}/{autoTradeSettings.maxDailyTrades}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Próximo Trade</span>
                      <span>{autoTradeSettings.tradeInterval}s</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Regras Atuais</div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <div>• Executar apenas quando confiança ≥ {autoTradeSettings.minConfidence}%</div>
                      <div>• Limitar a {autoTradeSettings.maxDailyTrades} trades por dia</div>
                      <div>• Intervalo mínimo de {autoTradeSettings.tradeInterval} segundos</div>
                      <div>• Multiplicador de risco: {autoTradeSettings.riskMultiplier}x</div>
                      <div>• Apenas ativos selecionados</div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={toggleAutoTrade}
                    className={`w-full ${isAutoTradeEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={!isBotActive}
                  >
                    {isAutoTradeEnabled ? 'Desativar Auto Trade' : 'Ativar Auto Trade'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Histórico de Trading</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {trades.map(trade => (
                      <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}`}>
                            {trade.type === 'buy' ? 'C' : 'V'}
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
                          <div className="text-sm text-gray-400">{trade.amount} unidades</div>
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