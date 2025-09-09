import { ArrowRight, Github, Zap, FileText, Shield, CheckCircle } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function HomePage({ onGetStarted }) {
  const { user } = useAuth()

  const features = [
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Securely connect to your GitHub repositories with encrypted token storage'
    },
    {
      icon: Zap,
      title: 'Smart Analysis',
      description: 'AI-powered analysis of your commits to identify meaningful contributions'
    },
    {
      icon: FileText,
      title: 'Professional Output',
      description: 'Generate polished resume bullet points with action verbs and impact metrics'
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your code stays private - we only analyze commit metadata and diffs'
    }
  ]

  const steps = [
    'Connect your GitHub account',
    'Select a repository to analyze',
    'Choose date range and filters',
    'Review generated bullet points',
    'Export to your resume'
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome back, {user.name || user.login}! 👋
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Transform your Git commit history into professional resume bullet points. 
            Let your code tell the story of your technical achievements.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <span>Get Started</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <feature.icon className="h-8 w-8 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">How It Works</h2>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
              <span className="text-gray-700">{step}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <span>Start Analyzing Your Commits</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Your Progress</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary-600">✓</div>
            <div className="text-sm text-gray-600">GitHub Connected</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">0</div>
            <div className="text-sm text-gray-600">Repos Analyzed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">0</div>
            <div className="text-sm text-gray-600">Commits Processed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">0</div>
            <div className="text-sm text-gray-600">Bullet Points Generated</div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          These stats will update as you use the tool to analyze your repositories
        </p>
      </div>
    </div>
  )
}