'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Home, LineChart as ChartIcon, Newspaper, Settings, Trophy, ArrowLeft, Info } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { ErrorBoundary } from 'react-error-boundary'
import Chart from 'chart.js/auto'
import { useAuth } from "@/contexts/AuthContext"
import { useLoading } from '@/contexts/loading-context'

function ErrorFallback({error}) {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
    </div>
  )
}

export default function Page({ params }) {
  const actualParams = use(params)
  const { game_code, round_code } = actualParams
  return <Trading game_code={game_code} round_code={round_code} />
}

function Trading({ game_code, round_code }) {
  const COMPANY_NAMES = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'GOOGL': 'Alphabet Inc.',
    'AMZN': 'Amazon.com Inc.',
    'META': 'Meta Platforms Inc.',
    'TSLA': 'Tesla Inc.',
    'BRK-B': 'Berkshire Hathaway Inc.',
    'JNJ': 'Johnson & Johnson',
    'V': 'Visa Inc.',
    'WMT': 'Walmart Inc.'
  };

  const router = useRouter()
  // const searchParams = useSearchParams()
  // const game_code = searchParams.get('game_code')
  // const round_code = searchParams.get('round_code')
  const [time, setTime] = useState(90)
  const [selectedStock, setSelectedStock] = useState(null)
  const [tradeAmount, setTradeAmount] = useState(0)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const { isAuthenticated, getIdToken } = useAuth();
  const { isLoading, setLoading } = useLoading()
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [roundIndex, setRoundIndex] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (chartRef.current && portfolio?.value_history) {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext('2d')
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: portfolio.value_history.map((_, index) => `Round ${index + 1}`),
          datasets: [{
            label: 'Portfolio Value',
            data: portfolio.value_history,
            borderColor: 'hsl(var(--primary))',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: (value) => `$${(value / 1000).toFixed(1)}K`
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => `Value: $${(context.parsed.y).toFixed(2)}`
              }
            }
          }
        }
      })
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [portfolio?.value_history])

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      setLoading(true)
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/');
      } else {
        const idToken = await getIdToken();
        const decodedToken = JSON.parse(atob(idToken.split('.')[1]));
        setUser(decodedToken);
        if (game_code && round_code) {
          await fetchMarketData();
        }
      }
      setLoading(false)
    };

    const fetchMarketData = async () => {
      try {
        const idToken = await getIdToken();
        const response = await fetch('http://localhost:5000/get_round_market_data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameCode: game_code, roundCode: round_code, idToken }),
        });
        if (response.status === 404) {
          alert('The round has already ended.');
          router.push('/join');
          return;
        }
        const data = await response.json();
        setPortfolio(data.portfolio);
        setRoundIndex(data.roundIndex);
        setStocks(data.marketData.stocks.map(stock => {
          const positions = data.portfolio.holdings
            ? data.portfolio.holdings.filter(h => h.ticker === stock.ticker)
            : [];
          const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
          const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
          const percentChange = ((stock.price - stock.previous_price) / stock.previous_price) * 100;
          return {
            id: stock.ticker,
            name: stock.ticker,
            price: stock.price,
            previousPrice: stock.previous_price,
            percentChange: percentChange,
            positions,
            totalShares,
            totalHoldings
          };
        }));
      } catch (error) {
        console.error('Error fetching market data:', error);
      }
    };

    checkAuthAndFetchData();
  }, [game_code, round_code, router, isAuthenticated, getIdToken, setLoading]);

  const formatTime = () => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleSliderChange = (value) => {
    setTradeAmount(value[0])
  }

  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10)
    if (!isNaN(value) && value >= 0 && value <= maxShares()) {
      setTradeAmount(value)
    }
  }

  const maxShares = () => {
    return selectedStock ? Math.floor(portfolio.cash / selectedStock.price) : 0;
  }

  async function handleBuy() {
    setLoading(true)
    const idToken = await getIdToken()
    const response = await fetch('http://localhost:5000/transact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        ticker: selectedStock.id,
        operation: 'buy',
        amount: tradeAmount,
        gameCode: game_code,
        roundIndex: roundIndex,
        roundCode: round_code,
      }),
    })
  
    if (response.ok) {
      const data = await response.json()
      setPortfolio(data.portfolio)
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const positions = data.portfolio.holdings
            ? data.portfolio.holdings.filter((h) => h.ticker === stock.id)
            : [];
          const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
          const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
          return {
            ...stock,
            positions,
            totalShares,
            totalHoldings
          };
        })
      )
      setSelectedStock((prevSelectedStock) => {
        const positions = data.portfolio.holdings
          ? data.portfolio.holdings.filter((h) => h.ticker === prevSelectedStock.id)
          : [];
        const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
        const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
        return {
          ...prevSelectedStock,
          positions,
          totalShares,
          totalHoldings
        };
      })
      alert('Transaction successful')
    } else {
      const errorData = await response.json()
      alert(`Transaction failed: ${errorData.error}`)
    }
    setLoading(false)
  }
  
  async function handleSell() {
    setLoading(true)
    const idToken = await getIdToken()
    const response = await fetch('http://localhost:5000/transact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        ticker: selectedStock.id,
        operation: 'sell',
        amount: tradeAmount,
        gameCode: game_code,
        roundIndex: roundIndex,
        roundCode: round_code,
      }),
    })
  
    if (response.ok) {
      const data = await response.json()
      setPortfolio(data.portfolio)
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const positions = data.portfolio.holdings
            ? data.portfolio.holdings.filter((h) => h.ticker === stock.id)
            : [];
          const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
          const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
          return {
            ...stock,
            positions,
            totalShares,
            totalHoldings
          };
        })
      )
      setSelectedStock((prevSelectedStock) => {
        const positions = data.portfolio.holdings
          ? data.portfolio.holdings.filter((h) => h.ticker === prevSelectedStock.id)
          : [];
        const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
        const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
        return {
          ...prevSelectedStock,
          positions,
          totalShares,
          totalHoldings
        };
      })
      alert('Transaction successful')
    } else {
      const errorData = await response.json()
      alert(`Transaction failed: ${errorData.error}`)
    }
    setLoading(false)
  }
  
  const calculateTotalAssets = () => {
    return stocks.reduce((total, stock) => {
      const positions = stock.positions;
      const stockPrice = stock.price;
      const totalHoldings = positions.reduce((sum, pos) => {
        if (pos.shares < 0) {
          return sum + (pos.price - stockPrice) * Math.abs(pos.shares) + pos.price * Math.abs(pos.shares);
        } else {
          return sum + stockPrice * pos.shares;
        }
      }, 0);
      return total + totalHoldings;
    }, 0);
  };

  async function handleClosePosition(positionId) {
    setLoading(true);
    const idToken = await getIdToken();
    const response = await fetch('http://localhost:5000/close_position', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        positionId,
        gameCode: game_code,
        roundCode: round_code,
      }),
    });
  
    if (response.ok) {
      const data = await response.json();
      setPortfolio(data.portfolio);
      setStocks((prevStocks) =>
        prevStocks.map((stock) => {
          const positions = data.portfolio.holdings
            ? data.portfolio.holdings.filter((h) => h.ticker === stock.id)
            : [];
          const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
          const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
          return {
            ...stock,
            positions,
            totalShares,
            totalHoldings,
          };
        })
      );
      setSelectedStock((prevSelectedStock) => {
        const positions = data.portfolio.holdings
          ? data.portfolio.holdings.filter((h) => h.ticker === prevSelectedStock.id)
          : [];
        const totalShares = positions.reduce((sum, pos) => sum + pos.shares, 0);
        const totalHoldings = positions.reduce((sum, pos) => sum + pos.shares * pos.price, 0);
        return {
          ...prevSelectedStock,
          positions,
          totalShares,
          totalHoldings,
        };
      });
      alert('Position closed successfully');
    } else {
      const errorData = await response.json();
      alert(`Failed to close position: ${errorData.error}`);
    }
    setLoading(false);
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white pb-16">
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <img alt="Profile" src="/globe.svg?height=48&width=48" />
              </Avatar>
              <div>
                <h1 className="text-xl font-bold">{user ? (user.name || user.email.split('@')[0]) : 'Loading...'}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Cash: ${portfolio ? portfolio.cash.toFixed(2) : '0.00'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">Total Portfolio: ${portfolio ? portfolio.cash.toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content={`Game Code: ${game_code} | Round Code: ${round_code}`}>
                <Info className="h-5 w-5 text-gray-600" />
              </Tooltip>
              <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-lg">{formatTime()}</span>
              <Button className="bg-green-600 hover:bg-green-700">Submit</Button>
            </div>
          </div>

          {/* Chart */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="h-[200px]">
                <canvas ref={chartRef}></canvas>
              </div>
            </CardContent>
          </Card>

          {/* Asset Summary */}
          <div className="mb-6 rounded-xl bg-yellow-100 p-6 shadow-lg">
            <div className="flex justify-between mb-4">
              <div>
                <div className="text-sm text-gray-600">Cash:</div>
                <div className="text-lg font-semibold">${portfolio ? portfolio.cash.toFixed(2) : '0.00'}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Assets:</div>
                <div className="text-lg font-semibold">${portfolio ? calculateTotalAssets().toFixed(2) : '0.00'}</div>
              </div>
            </div>
            
            {/* Stocks List or Trade Execution */}
            <div className="space-y-4">
              {selectedStock ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <Button 
                      variant="ghost" 
                      className="p-0 hover:bg-transparent"
                      onClick={() => setSelectedStock(null)}
                    >
                      <ArrowLeft className="h-6 w-6 mr-2" />
                      Back to Stocks
                    </Button>
                    <h2 className="text-xl font-bold">Execute Trade</h2>
                  </div>
                  <Card className="overflow-hidden bg-white">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <ChartIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{selectedStock.name} - {COMPANY_NAMES[selectedStock.name]}</h3>
                          <span className="text-sm text-green-600">+{selectedStock.percentChange.toFixed(2)}%</span>
                        </div>
                        <div className="mt-1 flex justify-between text-sm text-gray-600">
                          <span>Holdings: ${selectedStock.totalHoldings.toLocaleString()}</span>
                          <span>Positions: {selectedStock.positions.length}</span>
                        </div>
                      </div>
                      </CardContent>
                    </Card>
                    <div className="space-y-4 mt-6">
                      <h3 className="text-lg font-semibold">Open Positions</h3>
                      {selectedStock.positions.map((position) => (
                        <Card key={position.id} className="overflow-hidden bg-white">
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span>Price Purchased: ${position.price.toFixed(2)}</span>
                                <span>Shares: {position.shares}</span>
                                <span>Profit: ${((selectedStock.price - position.price) * position.shares).toFixed(2)}</span>
                              </div>
                            </div>
                            <Button 
                              className="bg-red-500 hover:bg-red-600"
                              onClick={() => handleClosePosition(position.id)}
                            >
                              Close Position
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="space-y-4 mt-6">
                      <label className="block text-sm font-medium text-gray-700">Amount:</label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          value={[tradeAmount]}
                          onValueChange={handleSliderChange}
                          max={maxShares()}
                          step={1}
                          className="flex-grow"
                        />
                        <Input
                          type="number"
                          value={tradeAmount}
                          onChange={handleInputChange}
                          className="w-24"
                        />
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        Total Price: ${(tradeAmount * (selectedStock ? selectedStock.price : 0)).toFixed(2)}
                      </div>
                      <div className="flex gap-4">
                        <Button className="flex-1 bg-green-500 hover:bg-green-600" onClick={handleBuy}>
                          Buy
                        </Button>
                        <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={handleSell}>
                          Sell
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  stocks.map((stock) => (
                    <Card key={stock.id} className="overflow-hidden bg-white">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                          <ChartIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{stock.name} - {COMPANY_NAMES[stock.name]}</h3>
                            <div className="flex items-center gap-4">
                              <span className={`text-sm ${stock.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                              </span>
                              <Button 
                                className="bg-blue-500 hover:bg-blue-600"
                                onClick={() => setSelectedStock(stock)}
                              >
                                Trade
                              </Button>
                            </div>
                          </div>
                          <div className="mt-1 flex justify-between text-sm text-gray-600">
                            <span>Price: ${stock.price.toFixed(2)}</span>
                            <span>Positions: {stock.positions.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
          <div className="container mx-auto flex justify-around p-2">
            {[
              { icon: Home, label: "Portfolio", link: `/${game_code}/${round_code}/portfolio`, selected: false },
              { icon: ChartIcon, label: "Trade", link: `/${game_code}/${round_code}/trade`, selected: true },
              { icon: Newspaper, label: "News", link: `/${game_code}/${round_code}/news`, selected: false },
              { icon: Trophy, label: "Leaderboard", link: `/${game_code}/${round_code}/leaderboard`, selected: false },
              { icon: Settings, label: "Settings", link: `/${game_code}/${round_code}/settings`, selected: false },
            ].map(({ icon: Icon, label, link, selected }) => (
              <a
                key={label}
                href={link}
                className={`flex flex-col items-center p-2 hover:text-primary ${selected ? "text-blue-600" : "text-gray-600"}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs">{label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}