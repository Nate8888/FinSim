'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CircleSlash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Forgotpwd() {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setStep('code')
  }

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    setStep('newPassword')
  }

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords don't match")
      return
    }
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
    // Redirect to login or show success message
    alert('Password reset successful!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container flex min-h-screen flex-col items-center justify-center">
        <Card className="w-full max-w-sm">
          <CardHeader className="space-y-1">
            <div className="flex justify-center">
              <div className="rounded-full bg-background p-3 shadow-sm">
                <CircleSlash2 className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Forgot Your Password?</CardTitle>
            <p className="text-center text-sm text-muted-foreground">
              {step === 'email'
                ? "No Worries! We'll Send You Reset Instructions!"
                : step === 'code'
                ? 'Enter the code we sent to your email'
                : 'Set your new password'}
            </p>
          </CardHeader>
          <CardContent>
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">EMAIL</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-4">
                  <Button className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Reset Password'}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => setStep('email')}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
            {step === 'code' && (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">VERIFICATION CODE</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter verification code"
                    required
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-4">
                  <Button className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => setStep('email')}
                    disabled={isLoading}
                  >
                    Try Different Email
                  </Button>
                </div>
              </form>
            )}
            {step === 'newPassword' && (
              <form onSubmit={handleNewPasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">NEW PASSWORD</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">CONFIRM NEW PASSWORD</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button className="w-full bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
            <div className="mt-4 text-center">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}