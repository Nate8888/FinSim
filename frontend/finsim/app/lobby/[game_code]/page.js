'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import axios from 'axios'
import { useLoading } from "@/contexts/loading-context"

export default function Lobby() {
  const [players, setPlayers] = useState([])
  const [isCreator, setIsCreator] = useState(false)
  const { user, isAuthenticated, getIdToken, signOut } = useAuth()
  const { setLoading } = useLoading()
  const router = useRouter()
  const { game_code: gameCode } = useParams()

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated()
      if (!authenticated) {
        router.push('/')
      }
    }
    checkAuth()
  }, [router, isAuthenticated])

  useEffect(() => {
    const fetchRoomDetails = async () => {
      setLoading(true)
      try {
        const idToken = await getIdToken()
        const response = await axios.get(`http://localhost:5000/get_room?gameCode=${gameCode}`)
        setPlayers(response.data.players)
        setIsCreator(response.data.createdBy === user.uid)
      } catch (error) {
        console.error('Error fetching room details:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRoomDetails()
  }, [gameCode, getIdToken, setLoading, user])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`http://localhost:5000/check_game_status?gameCode=${gameCode}`);
        if (response.data.started) {
          router.push(`/${response.data.gameCode}/${response.data.roundCode}/news`);
        }
      } catch (error) {
        console.error('Error checking game status:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [gameCode, router]);

  const refreshRoomDetails = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`http://localhost:5000/get_room?gameCode=${gameCode}`)
      setPlayers(response.data.players)
      setIsCreator(response.data.createdBy === user.uid)
    } catch (error) {
      console.error('Error refreshing room details:', error)
    } finally {
      setLoading(false)
    }
  }

  const startGame = async () => {
    setLoading(true)
    try {
      const idToken = await getIdToken()
      const response = await axios.post('http://localhost:5000/start_game', {
        gameCode,
        idToken
      })
      console.log('Game started:', response.data)
      // @TODO Redirect to game page or handle game start logic here
    } catch (error) {
      console.error('Error starting game:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white flex items-center justify-center">
      {user ? (
        <>
          <div className="absolute top-4 right-4 text-sm text-muted-foreground">
            Welcome, {user.displayName || user.email.split('@')[0]}
            <button onClick={handleSignOut} className="ml-4 text-red-500">
              Sign Out
            </button>
          </div>
          <div className="container max-w-md space-y-6 p-4 bg-white shadow-lg rounded-lg">
            <header className="flex items-center gap-4 border-b bg-background p-4">
              <h1 className="text-xl font-semibold">Lobby</h1>
            </header>

            <main className="space-y-6">
              <div className="space-y-2 text-center">
                <p className="text-sm text-muted-foreground">Code:</p>
                <span className="text-2xl font-bold tracking-wider text-primary">{gameCode}</span>
              </div>

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
                {players.length >= 2 && isCreator && (
                  <Button
                    className="mt-4 w-full bg-green-500 text-white hover:bg-green-600"
                    onClick={startGame}
                  >
                    Start Game Now
                  </Button>
                )}
              </div>
            </main>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  )
}