import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SiCurseforge } from 'react-icons/si'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <SiCurseforge className="w-10 h-10 text-primary animate-pulse" />
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />

  return <>{children}</>
}
