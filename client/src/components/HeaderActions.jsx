import { LogOut, User, Home } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function HeaderActions() {
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return null
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout()
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-3">
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || user.login}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
        )}
        <div className="text-sm">
          <div className="font-medium text-gray-900">{user.name || user.login}</div>
          <div className="text-gray-500">@{user.login}</div>
        </div>
      </div>
      
      <div className="h-6 w-px bg-gray-300"></div>
      
      <button
        onClick={handleLogout}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
        <span>Logout</span>
      </button>
    </div>
  )
}