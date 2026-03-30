import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FaDiscord } from 'react-icons/fa'
import { SiCurseforge } from 'react-icons/si'
import { Loader2, Mail } from 'lucide-react'

export default function AuthPage() {
  const { user, signInWithEmail, signUpWithEmail, signInWithDiscord, resetPasswordForEmail } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [forgotPassword, setForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await signInWithEmail(email, password)
    setLoading(false)
    if (error) toast.error(error.message)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error, needsEmailConfirmation } = await signUpWithEmail(email, password)
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else if (needsEmailConfirmation) {
      setEmailSent(true)
    }
  }

  const handleDiscord = async () => {
    const { error } = await signInWithDiscord()
    if (error) toast.error(error.message)
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await resetPasswordForEmail(email)
    setLoading(false)
    if (error) {
      toast.error(error.message)
    } else {
      setResetSent(true)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-xl">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Check your email</h2>
            <p className="text-white/60 text-sm mb-6">
              We sent a confirmation link to <span className="text-white/90">{email}</span>.<br />
              Click it to activate your account.
            </p>
            <Button variant="outline" className="bg-white/5 border-white/20" onClick={() => setEmailSent(false)}>
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <SiCurseforge className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold" style={{ fontFamily: "'Maplestory OTF Bold', sans-serif" }}>
            Maple Forge
          </span>
        </div>

        <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
          <Tabs defaultValue="signin">
            <TabsList className="w-full mb-6 bg-white/5 border border-white/10">
              <TabsTrigger value="signin" className="flex-1 data-[state=active]:bg-white/10">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-white/10">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              {resetSent ? (
                <div className="text-center flex flex-col items-center gap-4 py-2">
                  <Mail className="w-10 h-10 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-white">Reset link sent</p>
                    <p className="text-xs text-white/50 mt-1">Check <span className="text-white/80">{email}</span> for a password reset link.</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white/5 border-white/20" onClick={() => { setResetSent(false); setForgotPassword(false) }}>
                    Back to Sign In
                  </Button>
                </div>
              ) : forgotPassword ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">Reset your password</p>
                    <p className="text-xs text-white/50">We'll send a reset link to your email.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 focus:border-white/40"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                  </Button>
                  <button type="button" onClick={() => setForgotPassword(false)} className="w-full text-xs text-white/40 hover:text-white/70 transition-colors">
                    Back to Sign In
                  </button>
                </form>
              ) : (
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 focus:border-white/40"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="signin-password">Password</Label>
                      <button type="button" onClick={() => setForgotPassword(true)} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                        Forgot password?
                      </button>
                    </div>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 focus:border-white/40"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/20 focus:border-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/20 focus:border-white/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/20 focus:border-white/40"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-transparent text-white/40 uppercase tracking-widest">or continue with</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#5865F2]/10 border-[#5865F2]/30 hover:bg-[#5865F2]/20 text-[#7289da] hover:text-[#7289da]"
              onClick={handleDiscord}
            >
              <FaDiscord className="w-5 h-5 mr-2" />
              Continue with Discord
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
