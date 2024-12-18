'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Home, LineChart as ChartIcon, Newspaper, Settings, Trophy, ChevronDown, Info } from "lucide-react"
import { Tooltip } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/AuthContext"

async function checkUserRoundCompletion(game_code, round_code, idToken) {
  const response = await fetch('https://finsimulator.uc.r.appspot.com/check_user_round_completion', {
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
  return <News game_code={game_code} round_code={round_code} />
}

function News({ game_code, round_code }) {
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
  const { isAuthenticated, getIdToken } = useAuth();
  const [time, setTime] = useState(90)
  const [marketData, setMarketData] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [timer, setTimer] = useState(null);

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

    const timerInterval = setInterval(() => {
      const currentTime = new Date();
      const timeDiff = Math.max(0, Math.floor((endTime - currentTime) / 1000));
      setTime(timeDiff);

      if (timeDiff <= 0) {
        clearInterval(timerInterval);
        handleSubmit();  // Call handleSubmit when the round ends
      }
    }, 1000);

    setTimer(timerInterval);

    return () => clearInterval(timerInterval);
  }, []);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
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
          fetchMarketData();
        }
      }
    };

    const fetchMarketData = async () => {
      try {
        const idToken = await getIdToken(); // Use the getIdToken function from useAuth
        const response = await fetch('https://finsimulator.uc.r.appspot.com/get_round_market_data', {
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
        setMarketData(data.marketData);
        setPortfolio(data.portfolio);
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
        if (error.message === 'No user is currently signed in') {
          try {
            const idToken = await getIdToken(true); // Force refresh the token
            const response = await fetch('https://finsimulator.uc.r.appspot.com/get_round_market_data', {
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
            setMarketData(data.marketData);
            setPortfolio(data.portfolio);
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
          } catch (refreshError) {
            console.error('Error fetching market data after token refresh:', refreshError);
          }
        } else {
          console.error('Error fetching market data:', error);
        }
      }
    };

    checkAuthAndFetchData();
  }, [game_code, round_code, router, isAuthenticated, getIdToken]);

  const formatTime = () => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const macroIndicators = marketData ? [
    { label: "Interest Rate", value: `${marketData.interest_rate}%`, change: "Quarter Change: +0.25%" },
    { label: "Inflation Rate", value: `${marketData.inflation_rate}%`, change: "Quarter Change: -0.15%" },
    { label: "GDP Growth", value: `${marketData.gdp_growth_rate}%`, change: "Quarter Change: +0.30%" },
  ] : [];

  const globalNews = marketData ? marketData.global_news : [];

  const companyNews = marketData ? marketData.stocks.flatMap(stock => 
    stock.news.map(newsItem => ({
      headline: `${stock.ticker} (${COMPANY_NAMES[stock.ticker]}): ${newsItem}`,
      content: newsItem
    }))
  ) : [];

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

  const handleSubmit = async () => {
    setLoading(true);
    clearInterval(timer);
    localStorage.removeItem('endTime');
    const idToken = await getIdToken();
    const response = await fetch('https://finsimulator.uc.r.appspot.com/complete_round', {
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
    } else {
      const errorData = await response.json();
      alert(`Failed to complete round: ${errorData.error}`);
    }
    setLoading(false);
  }

  return (
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
                <span className="text-md font-semibold">Cash: ${portfolio ? portfolio.cash.toFixed(2) : '0.00'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-md font-semibold">Total Portfolio: ${portfolio ? (portfolio.cash + calculateTotalAssets()).toFixed(2) : '0.00'}</span>
                {/* <span className="text-sm font-medium text-green-600">+10.55%</span> */}
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

        {/* Macro Overview */}
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-lg font-semibold">Economic Indicators:</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                {macroIndicators.map((indicator, index) => (
                  <div key={index} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground">{indicator.label}</div>
                    <div className="text-sm font-bold">{indicator.value}</div>
                    <div className="text-xs text-muted-foreground">{indicator.change}</div>
                  </div>
                ))}
              </div>
              </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <h2 className="mb-2 text-lg font-semibold">Global News:</h2>
              <ul className="space-y-1 text-sm">
                {globalNews.map((news, index) => (
                  <li key={index} className="text-muted-foreground">{news}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Company News */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Company News:</h2>
          {companyNews.map((news, index) => (
            <Collapsible key={index} className="w-full">
              <Card>
                <CollapsibleTrigger className="w-full">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="text-left">
                      <div className="font-semibold">{news.headline}</div>
                    </div>
                    <ChevronDown className="h-5 w-5" />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="border-t px-4 py-3">
                    <p className="text-sm text-muted-foreground">{news.content}</p>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="container mx-auto flex justify-around p-2">
          {[
            { icon: Home, label: "Portfolio", link: `/${game_code}/${round_code}/portfolio`, selected: false },
            { icon: ChartIcon, label: "Trade", link: `/${game_code}/${round_code}/trade`, selected: false },
            { icon: Newspaper, label: "News", link: `/${game_code}/${round_code}/news`, selected: true },
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
  )
}