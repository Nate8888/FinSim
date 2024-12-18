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
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import axios from 'axios';
import { useLoading } from "@/contexts/loading-context";

export default function Create() {
    const [gameCode, setGameCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [players, setPlayers] = useState([]);
    const [rounds, setRounds] = useState('8');
    const [timePerRound, setTimePerRound] = useState('90');
    const [difficulty, setDifficulty] = useState('easy');
    const [roomCreated, setRoomCreated] = useState(false);

    const { isAuthenticated, getIdToken } = useAuth();
    const { setLoading } = useLoading();
    const router = useRouter();

    useEffect(() => {
        localStorage.removeItem('endTime');
        const checkAuth = async () => {
            const authenticated = await isAuthenticated();
            if (!authenticated) {
                router.push('/');
            }
        };
        checkAuth();
    }, [router, isAuthenticated]);

    useEffect(() => {
        setPlayers([]);
    }, []);

    const fetchRoomDetails = async (gameCode) => {
        try {
            const response = await axios.get(`https://finsimulator.uc.r.appspot.com/get_room?gameCode=${gameCode}`);
            setPlayers(response.data.players);
        } catch (error) {
            console.error('Error fetching room details:', error);
        }
    };

    const refreshRoomDetails = async () => {
        setLoading(true);
        try {
            await fetchRoomDetails(gameCode);
        } catch (error) {
            console.error('Error refreshing room details:', error);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(gameCode)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const inviteFriends = async () => {
        await copyToClipboard();
    };

    const createRoom = async () => {
        const generateGameCode = () => {
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = '';
            for (let i = 0; i < 5; i++) {
                result += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return result;
        };

        const code = generateGameCode();
        setGameCode(code);
        setLoading(true);
        try {
            const idToken = await getIdToken();
            const response = await axios.post('https://finsimulator.uc.r.appspot.com/create_room', {
                gameCode: code,
                rounds,
                timePerRound,
                difficulty,
                idToken
            });
            console.log('Room created:', response.data);
            setRoomCreated(true);
            fetchRoomDetails(code); // Fetch initial room details
        } catch (error) {
            console.error('Error creating room:', error);
        } finally {
            setLoading(false);
        }
    };

    const startGame = async () => {
        setLoading(true);
        try {
            const idToken = await getIdToken();
            const response = await axios.post('https://finsimulator.uc.r.appspot.com/start_game', {
                gameCode,
                idToken
            });
            console.log('Game started:', response.data);
            // Wait a second and check game status
            setTimeout(async () => {
                try {
                    const statusResponse = await axios.get(`https://finsimulator.uc.r.appspot.com/check_game_status?gameCode=${gameCode}`);
                    if (statusResponse.data.started) {
                        router.push(`/${statusResponse.data.gameCode}/${statusResponse.data.roundCode}/news`);
                    }
                } catch (error) {
                    console.error('Error checking game status:', error);
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting game:', error);
        } finally {
            setLoading(false);
        }
    };

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
                    {!roomCreated ? (
                        <div className="space-y-6">
                            <div className="space-y-1 border-t pt-6">
                                <h2 className="text-lg font-semibold tracking-tight">GAME SETTINGS</h2>
                            </div>

                            <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium" htmlFor="rounds">
                                        Rounds
                                    </label>
                                    <Select defaultValue="8" onValueChange={setRounds}>
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
                                    <Select defaultValue="90" onValueChange={setTimePerRound}>
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
                                    <Select defaultValue="easy" onValueChange={setDifficulty}>
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

                            <Button className="w-full bg-green-500 text-white hover:bg-green-600" onClick={createRoom}>
                                Create Room
                            </Button>
                        </div>
                    ) : (
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
                                onClick={inviteFriends}
                            >
                                Invite friends to the game
                            </Button>
                        </div>
                    )}

                    {roomCreated && (
                        <div className="rounded-lg bg-yellow-100 p-4 shadow-inner">
                            <div className="flex items-center justify-between">
                                <h2 className="font-medium text-yellow-800">Players in Waiting Room</h2>
                                <Button
                                    variant="outline"
                                    className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                                    onClick={refreshRoomDetails}
                                >
                                    Refresh
                                </Button>
                            </div>
                            <ul className="mt-4 grid grid-cols-2 gap-2">
                                {players.map((name, index) => (
                                    <li key={index} className="text-sm text-yellow-700">{name}</li>
                                ))}
                            </ul>
                            {players.length >= 2 && (
                                <Button
                                    className="mt-4 w-full bg-green-500 text-white hover:bg-green-600"
                                    onClick={startGame}
                                >
                                    Start Game Now
                                </Button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}