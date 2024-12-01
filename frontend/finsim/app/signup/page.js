'use client'

import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoading } from '@/contexts/loading-context'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const { setLoading } = useLoading()
  const { registerWithEmail, signInWithGoogle, sendVerificationEmail, verifyCode } = useAuth()
  const router = useRouter()

  useEffect(() => {
    localStorage.removeItem('endTime');
  }, []);

  const handleSendVerification = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await sendVerificationEmail(email);
      setIsVerificationSent(true);
      // Lock the email and password fields
      setEmail(email); // Keep the email value as a string
      setPassword(password); // Keep the password value as a string
      setConfirmPassword(confirmPassword); // Keep the confirmPassword value as a string
    } catch (error) {
      setError('Failed to send verification email: ' + error.message);
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyCode(email, verificationCode);
      await registerWithEmail(email, password);
      router.push('/'); // Redirect to sign-in page
    } catch (error) {
      setError('Verification error: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto min-h-screen max-w-md px-6 py-12">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-background p-4 shadow-sm">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign Up</h1>
          <p className="text-sm text-muted-foreground">Create Your Account</p>
        </div>
        <div className="mt-8 space-y-6">
          <form className="space-y-4" onSubmit={isVerificationSent ? handleVerifyCode : handleSendVerification}>
            <div className="space-y-2">
              <Label htmlFor="email">EMAIL</Label>
              <Input
                id="email"
                placeholder="email"
                required
                type="email"
                className="shadow-md"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isVerificationSent}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">PASSWORD</Label>
              <Input
                id="password"
                placeholder="password"
                required
                type="password"
                className="shadow-md"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isVerificationSent}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">CONFIRM PASSWORD</Label>
              <Input
                id="confirmPassword"
                placeholder="confirm password"
                required
                type="password"
                className="shadow-md"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isVerificationSent}
              />
            </div>
            {isVerificationSent && (
              <div className="space-y-2">
                <Label htmlFor="verificationCode">VERIFICATION CODE</Label>
                <Input
                  id="verificationCode"
                  placeholder="verification code"
                  required
                  type="text"
                  className="shadow-md"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
              </div>
            )}
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" required />
              <Label className="text-sm" htmlFor="terms">
                By creating an account, I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>
            <Button className="w-full bg-yellow-400 font-medium hover:bg-yellow-500" type="submit">
              {isVerificationSent ? 'Verify Code' : 'Send Verification Code'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Button
            className="w-full bg-black text-white hover:bg-gray-800"
            variant="outline"
            onClick={async () => {
              setLoading(true);
              try {
                await signInWithGoogle();
                router.push('/action'); // Redirect to /action page
              } catch (error) {
                setError('Google sign-in error: ' + error.message);
              }
              setLoading(false);
            }}
          >
            Sign in with Google
          </Button>
          <div className="text-center text-sm">
            Already have an account?{' '}
            <Link className="font-medium underline" href="/">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}