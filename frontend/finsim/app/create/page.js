'use client'

import { ArrowLeft, Copy, HelpCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react"

export default function Create() {
    const [gameCode] = useState('XQWSA')
    const [copied, setCopied] = useState(false)
    const [players, setPlayers] = useState([])

    useEffect(() => {
        // Simulating players joining the waiting room
        const names = ["Alice", "Bob", "Charlie", "David", "Eva", "Frank", "Grace", "Henry"]
        setPlayers(names)
    }, [])

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(gameCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
            <div className="container max-w-md space-y-6 p-4 bg-white shadow-lg rounded-lg">
                <header className="flex items-center gap-4 border-b bg-background p-4">
                    <Link href="/action" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-xl font-semibold">Create Game</h1>
                    <HelpCircle className="ml-auto h-6 w-6 text-muted-foreground" />
                </header>

                <main className="space-y-6">
                    <div className="space-y-2 text-center">
                        <p className="text-sm text-muted-foreground">Code:</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-bold tracking-wider text-primary">{gameCode}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={copyToClipboard}
                            >
                                <Copy className="h-4 w-4" />
                                <span className="sr-only">Copy game code</span>
                            </Button>
                        </div>
                        {copied && (
                            <p className="text-sm text-muted-foreground">Copied to clipboard!</p>
                        )}
                        <Button
                            variant="outline"
                            className="mt-2 w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                            Invite friends to the game
                        </Button>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1 border-t pt-6">
                            <h2 className="text-lg font-semibold tracking-tight">GAME SETTINGS</h2>
                        </div>

                        <div className="grid gap-4">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium" htmlFor="rounds">
                                    Rounds
                                </label>
                                <Select defaultValue="8">
                                    <SelectTrigger className="w-[180px]" id="rounds">
                                        <SelectValue placeholder="Select rounds" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[4, 6, 8, 10, 12].map((num) => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium" htmlFor="time">
                                    Time Per Round
                                </label>
                                <Select defaultValue="90">
                                    <SelectTrigger className="w-[180px]" id="time">
                                        <SelectValue placeholder="Select time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[30, 60, 90, 120, 180].map((num) => (
                                            <SelectItem key={num} value={num.toString()}>
                                                {num}s
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium" htmlFor="difficulty">
                                    Difficulty
                                </label>
                                <Select defaultValue="easy">
                                    <SelectTrigger className="w-[180px]" id="difficulty">
                                        <SelectValue placeholder="Select difficulty" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                            Start the game
                        </Button>
                    </div>

                    <div className="rounded-lg bg-yellow-100 p-4 shadow-inner">
                        <h2 className="font-medium text-yellow-800">Players in Waiting Room</h2>
                        <ul className="mt-4 grid grid-cols-2 gap-2">
                            {players.map((name, index) => (
                                <li key={index} className="text-sm text-yellow-700">{name}</li>
                            ))}
                        </ul>
                    </div>
                </main>
            </div>
        </div>
    )
}