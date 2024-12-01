'use client'

import { Card } from "@/components/ui/card"
import { Home, BarChartIcon as ChartIcon, Newspaper, Settings, Trophy, BookOpen, ArrowLeft, Info } from 'lucide-react'
import { Line, LineChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from 'next/navigation'
import { Tooltip as UITooltip } from "@/components/ui/tooltip"
import { use } from 'react'
import { useAuth } from "@/contexts/AuthContext"

const data = [
    { round: 1, player1: 1000000, player2: 1200000, player3: 800000, player4: 950000, player5: 1100000, player6: 850000, player7: 1050000, player8: 900000 },
    { round: 2, player1: 1100000, player2: 1150000, player3: 900000, player4: 1000000, player5: 1050000, player6: 900000, player7: 1100000, player8: 950000 },
    { round: 3, player1: 1300000, player2: 1250000, player3: 750000, player4: 1100000, player5: 1200000, player6: 800000, player7: 1150000, player8: 1000000 },
    { round: 4, player1: 1200000, player2: 1300000, player3: 850000, player4: 1050000, player5: 1250000, player6: 750000, player7: 1200000, player8: 1100000 },
    { round: 5, player1: 1400000, player2: 1200000, player3: 700000, player4: 1150000, player5: 1300000, player6: 800000, player7: 1250000, player8: 1050000 },
    { round: 6, player1: 1555432.5, player2: 1200221.6, player3: 815213.2, player4: 1250000, player5: 1350000, player6: 780000, player7: 1300000, player8: 1100000 },
]

const players = [
    { id: 1, name: "David Curtis", initials: "DC", value: 1555432.5, change: "+55.54%", color: "#FF0000" },
    { id: 2, name: "Sarah Chen", initials: "SC", value: 1200221.6, change: "+13.77%", color: "#000000" },
    { id: 3, name: "Ray Johnson", initials: "RJ", value: 815213.2, change: "-25.63%", color: "#0000FF" },
    { id: 4, name: "Emma Wilson", initials: "EW", value: 1250000, change: "+31.58%", color: "#FFA500" },
    { id: 5, name: "Michael Brown", initials: "MB", value: 1350000, change: "+22.73%", color: "#8B4513" },
    { id: 6, name: "Olivia Taylor", initials: "OT", value: 780000, change: "-8.24%", color: "#800000" },
    { id: 7, name: "Daniel Lee", initials: "DL", value: 1300000, change: "+23.81%", color: "#000080" },
    { id: 8, name: "Sophia Martinez", initials: "SM", value: 1100000, change: "+22.22%", color: "#8B0000" },
]

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
  return <Leaderboard game_code={game_code} round_code={round_code} />
}

function Leaderboard({ game_code, round_code }) {
    const router = useRouter()
    const { isAuthenticated, getIdToken } = useAuth();
    const [time, setTime] = useState(90)
    const [leaderboard, setLeaderboard] = useState([])
    const [history, setHistory] = useState([])

    useEffect(() => {
        const timer = setInterval(() => {
            setTime((prevTime) => (prevTime > 0 ? prevTime - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

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
                await fetchLeaderboard();
            }
        };
        async function fetchLeaderboard() {
            const response = await fetch(`http://127.0.0.1:5000/leaderboard?gameCode=${game_code}`)
            const data = await response.json()
            setLeaderboard(data.leaderboard)
            setHistory(data.history)
        }
        checkAuthAndFetchData();
    }, [game_code, round_code, router, isAuthenticated, getIdToken])

    const formatTime = () => {
        const minutes = Math.floor(time / 60)
        const seconds = time % 60
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white">
            <main className="flex-1 flex items-center justify-center">
                <div className="container max-w-md px-4 py-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">LeaderBoard</h1>
                        <div className="flex items-center gap-2">
                            <UITooltip content={`Game Code: ${game_code} | Round Code: ${round_code}`}>
                                <Info className="h-5 w-5 text-gray-600" />
                            </UITooltip>
                            <span className="rounded-lg bg-gray-100 px-3 py-2 font-mono text-sm">{formatTime()}</span>
                            <Button className="bg-green-600 hover:bg-green-700">Submit</Button>
                        </div>
                    </div>

                    {/* Leaderboard List */}
                    <div className="mb-8 space-y-4">
                        {leaderboard.map((player, index) => (
                            <Card key={index} className="flex items-center gap-4 p-4">
                                <div className="text-lg font-bold">{index + 1}</div>
                                <div className="flex-1">
                                    <div className="font-semibold">{player.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        ${player.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Chart Legend */}
                    <div className="mb-4 flex flex-wrap justify-center gap-2">
                        {leaderboard.map((player, index) => (
                            <div key={index} className="flex items-center">
                                <div className="h-6 w-6 mr-1 flex items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: players[index]?.color || "#000" }}>
                                    {player.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-xs font-medium">{player.name.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>

                    {/* Portfolio Chart */}
                    <div className="mb-20 h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                                <XAxis dataKey="round" tickLine={false} axisLine={false} />
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    formatter={(value) => [`$${value.toLocaleString()}`, "Portfolio Value"]}
                                    labelFormatter={(label) => `Round ${label}`}
                                />
                                {leaderboard.map((player, index) => (
                                    <Line
                                        key={player.name}
                                        type="monotone"
                                        dataKey={player.name}
                                        stroke={players[index]?.color || "#000"}
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
          <div className="container mx-auto flex justify-around p-2">
            {[
              { icon: Home, label: "Portfolio", link: `/${game_code}/${round_code}/portfolio`, selected: false },
              { icon: ChartIcon, label: "Trade", link: `/${game_code}/${round_code}/trade`, selected: false },
              { icon: Newspaper, label: "News", link: `/${game_code}/${round_code}/news`, selected: false },
              { icon: Trophy, label: "Leaderboard", link: `/${game_code}/${round_code}/leaderboard`, selected: true },
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