import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { SiCurseforge } from 'react-icons/si'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const { loading, isPasswordRecovery, updatePassword, clearPasswordRecovery } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!loading && !isPasswordRecovery) navigate('/auth', { replace: true })
  }, [loading, isPasswordRecovery, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
    } else {
      clearPasswordRecovery()
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
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
          {done ? (
            <div className="text-center flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
              <div>
                <p className="text-sm font-medium text-white">Password updated</p>
                <p className="text-xs text-white/50 mt-1">Redirecting you home...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1 mb-2">
                <p className="text-sm font-medium text-white">Set a new password</p>
                <p className="text-xs text-white/50">Choose a strong password for your account.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="bg-white/5 border-white/20 focus:border-white/40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/20 focus:border-white/40"
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
