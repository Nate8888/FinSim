'use client'

import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, LineChart as ChartIcon, Newspaper, Settings, Trophy, Info, ChevronDown, ChevronUp } from "lucide-react"
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

async function checkUserRoundCompletion(game_code, round_code, idToken) {
  const response = await fetch('http://localhost:5000/check_user_round_completion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gameCode: game_code,
      roundCode: round_code,
      idToken,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    return data.userCompleted;
  }
  return false;
}

export default function Page({ params }) {
  const actualParams = use(params)
  const { game_code, round_code } = actualParams
  return <Portfolio game_code={game_code} round_code={round_code} />
}

function Portfolio({ game_code, round_code }) {
  const router = useRouter()
  const [time, setTime] = useState(90)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [expandedStocks, setExpandedStocks] = useState(new Set())
  const { isAuthenticated, getIdToken } = useAuth();
  const { isLoading, setLoading } = useLoading()
  const [user, setUser] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [roundIndex, setRoundIndex] = useState(null);

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

  const toggleStock = (stockId) => {
    setExpandedStocks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(stockId)) {
        newSet.delete(stockId)
      } else {
        newSet.add(stockId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const storedEndTime = localStorage.getItem('endTime');
    let endTime;
    if (storedEndTime) {
      endTime = new Date(parseInt(storedEndTime, 10));
    } else {
      const storedTimePerRound = localStorage.getItem('timePerRound');
      const roundDuration = storedTimePerRound ? parseInt(storedTimePerRound, 10) : 90;
      endTime = new Date(Date.now() + roundDuration * 1000);
      localStorage.setItem('endTime', endTime.getTime());
    }

    const timer = setInterval(() => {
      const currentTime = new Date();
      const timeDiff = Math.max(0, Math.floor((endTime - currentTime) / 1000));
      setTime(timeDiff);

      if (timeDiff <= 0) {
        clearInterval(timer);
        handleSubmit();  // Call handleSubmit when the round ends
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
        const userCompleted = await checkUserRoundCompletion(game_code, round_code, idToken);
        if (userCompleted) {
          router.push(`/${game_code}/${round_code}/wait`);
          return;
        }
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
        localStorage.setItem('timePerRound', data.timePerRound);  // Store timePerRound in localStorage
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

  async function handleSubmit() {
    setLoading(true);
    const idToken = await getIdToken();
    const response = await fetch('http://localhost:5000/complete_round', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        gameCode: game_code,
        roundCode: round_code,
      }),
    });
  
    if (response.ok) {
      router.push(`/${game_code}/${round_code}/wait`);
      const checkCompletionInterval = setInterval(async () => {
        const checkResponse = await fetch('http://localhost:5000/check_round_completion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameCode: game_code,
            roundCode: round_code,
          }),
        });
  
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.allUsersCompleted) {
            clearInterval(checkCompletionInterval);
            router.push(`/${game_code}/${checkData.newRoundCode}/portfolio`);
          }
        }
      }, 5000); // Check every 5 seconds
    } else {
      const errorData = await response.json();
      alert(`Failed to complete round: ${errorData.error}`);
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
                  <span className="text-lg font-semibold">Total Portfolio: ${portfolio ? (portfolio.cash + calculateTotalAssets()).toFixed(2) : '0.00'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content={`Game Code: ${game_code} | Round Code: ${round_code}`}>
                <Info className="h-5 w-5 text-gray-600" />
              </Tooltip>
              <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-lg">{formatTime()}</span>
              <Button className="bg-green-600 hover:bg-green-700" onClick={handleSubmit}>Submit</Button>
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
            
            {/* Stocks List with Collapsible Positions */}
            <div className="space-y-4">
              {stocks.map((stock) => (
                <Card key={stock.id} className="overflow-hidden bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleStock(stock.id)}>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                        <ChartIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{stock.name} - {COMPANY_NAMES[stock.name]}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${stock.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                            </span>
                            {expandedStocks.has(stock.id) ? <ChevronUp /> : <ChevronDown />}
                          </div>
                        </div>
                        <div className="mt-1 flex justify-between text-sm text-gray-600">
                          <span>Price: ${stock.price.toFixed(2)}</span>
                          <span>Positions: {stock.positions.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Positions */}
                    {expandedStocks.has(stock.id) && stock.positions.length > 0 && (
                      <div className="mt-4 space-y-2 border-t pt-4">
                        {stock.positions.map((position) => (
                          <div key={position.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                            <span>Purchase Price: ${position.price.toFixed(2)}</span>
                            <span>Shares: {position.shares}</span>
                            <span className={((stock.price - position.price) * position.shares >= 0) ? 'text-green-600' : 'text-red-600'}>
                              Profit: ${((stock.price - position.price) * position.shares).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
          <div className="container mx-auto flex justify-around p-2">
            {[
              { icon: Home, label: "Portfolio", link: `/${game_code}/${round_code}/portfolio`, selected: true },
              { icon: ChartIcon, label: "Trade", link: `/${game_code}/${round_code}/trade`, selected: false },
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