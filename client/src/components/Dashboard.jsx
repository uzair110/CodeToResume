import { useState } from 'react'
import { useAuth } from './AuthProvider'
import LoginForm from './LoginForm'
import RepositorySelector from './RepositorySelector'
import HomePage from './HomePage'

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState('home') // 'home', 'repositories', 'analysis'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Commit Resume Generator
            </h2>
            <p className="text-gray-600">
              Transform your Git commits into professional resume bullet points
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    )
  }

  const renderCurrentView = () => {
    switch (currentView) {
      case 'repositories':
        return <RepositorySelector onBack={() => setCurrentView('home')} />
      case 'analysis':
        return <div>Analysis view coming soon...</div>
      default:
        return <HomePage onGetStarted={() => setCurrentView('repositories')} />
    }
  }

  return (
    <div className="space-y-8 fade-in">
      {renderCurrentView()}
    </div>
  )
}