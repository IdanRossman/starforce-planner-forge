import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { FcGoogle } from 'react-icons/fc'
import { FaDiscord } from 'react-icons/fa'
import { SiCurseforge } from 'react-icons/si'
import { Loader2, Mail } from 'lucide-react'

export default function AuthPage() {
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithDiscord } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailSent, setEmailSent] = useState(false)

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

  const handleGoogle = async () => {
    const { error } = await signInWithGoogle()
    if (error) toast.error(error.message)
  }

  const handleDiscord = async () => {
    const { error } = await signInWithDiscord()
    if (error) toast.error(error.message)
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
            Starforce Planner
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
                  <Label htmlFor="signin-password">Password</Label>
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
              className="w-full bg-white/5 border-white/20 hover:bg-white/10"
              onClick={handleGoogle}
            >
              <FcGoogle className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>
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
