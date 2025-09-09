import { useState } from 'react'
import { Github, AlertCircle } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function LoginForm() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token.trim()) {
      setError('Please enter your GitHub token')
      return
    }

    setLoading(true)
    setError('')

    const result = await login(token.trim())
    
    if (!result.success) {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
          GitHub Personal Access Token
        </label>
        <input
          type="password"
          id="token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={loading}
        />
        <p className="mt-2 text-sm text-gray-500">
          Need a token? 
          <a 
            href="https://github.com/settings/tokens/new?scopes=repo" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 ml-1"
          >
            Create one here
          </a>
        </p>
      </div>

      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <>
            <Github className="h-4 w-4" />
            <span>Connect GitHub</span>
          </>
        )}
      </button>
    </form>
  )
}