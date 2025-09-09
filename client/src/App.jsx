import { useState } from 'react'
import { Github } from 'lucide-react'
import AuthProvider from './components/AuthProvider'
import Dashboard from './components/Dashboard'
import HeaderActions from './components/HeaderActions'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <Github className="h-8 w-8 text-primary-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Commit Resume Generator
                </h1>
              </div>
              <HeaderActions />
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard />
        </main>
      </div>
    </AuthProvider>
  )
}

export default App