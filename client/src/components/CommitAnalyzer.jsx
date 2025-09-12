import { useState, useEffect } from 'react'
import { ArrowLeft, User, GitCommit, Filter, Download, BarChart3, Clock, Brain } from 'lucide-react'
import api from '../services/api'
import CommitAnalysisView from './CommitAnalysisView'
import './CommitAnalysisView.css'

export default function CommitAnalyzer({ repository, onBack }) {
  const [commits, setCommits] = useState([])
  const [stats, setStats] = useState(null)
  const [contributors, setContributors] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingContributors, setLoadingContributors] = useState(false)
  const [error, setError] = useState('')
  // Helper function to get default dates
  const getDefaultDates = () => {
    const today = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(today.getMonth() - 6)
    
    return {
      since: sixMonthsAgo.toISOString().split('T')[0], // Format: YYYY-MM-DD
      until: today.toISOString().split('T')[0]
    }
  }

  const [filters, setFilters] = useState({
    ...getDefaultDates(),
    author: '',
    page: 1
  })
  const [pagination, setPagination] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisResults, setAnalysisResults] = useState(null)



  useEffect(() => {
    if (repository) {
      // First try to fetch commits to validate repository access
      fetchCommits()
      // Only fetch additional data if commits succeed
      fetchContributors()
      fetchStats()
    }
  }, [repository])

  useEffect(() => {
    if (repository) {
      fetchCommits()
      fetchStats()
    }
  }, [filters.since, filters.until, filters.author])

  const fetchCommits = async (page = 1) => {
    if (!repository?.full_name) {
      setError('Repository information is missing')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const params = {
        per_page: 30,
        page
      }
      
      if (filters.since) params.since = filters.since
      if (filters.until) params.until = filters.until
      if (filters.author) params.author = filters.author

      console.log('Fetching commits with params:', params)

      const response = await api.get(`/commits/${repository.full_name}`, { params })
      
      console.log('Received commits:', response.data.commits.length)
      
      if (page === 1) {
        setCommits(response.data.commits)
      } else {
        setCommits(prev => [...prev, ...response.data.commits])
      }
      
      setPagination(response.data.pagination)
    } catch (error) {
      console.error('Failed to fetch commits:', error)
      
      if (error.response?.status === 404) {
        setError(`Repository "${repository.full_name}" not found or you don't have access to it.`)
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please check your GitHub token.')
      } else {
        setError(error.response?.data?.message || 'Failed to fetch commits')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchContributors = async () => {
    if (!repository?.full_name) return

    try {
      setLoadingContributors(true)
      const response = await api.get(`/commits/${repository.full_name}/contributors`)
      setContributors(response.data.contributors)
    } catch (error) {
      console.error('Failed to fetch contributors:', error)
      // Don't show error for contributors as it's not critical
    } finally {
      setLoadingContributors(false)
    }
  }

  const fetchStats = async () => {
    if (!repository?.full_name) return

    try {
      const params = {}
      if (filters.since) params.since = filters.since
      if (filters.until) params.until = filters.until
      if (filters.author) params.author = filters.author

      const response = await api.get(`/commits/${repository.full_name}/stats`, { params })
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Don't show error for stats as it's not critical
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const loadMoreCommits = () => {
    if (pagination?.has_next) {
      fetchCommits(pagination.page + 1)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCommitTypeColor = (message) => {
    const msg = message.toLowerCase()
    if (msg.includes('feat') || msg.includes('add')) return 'bg-green-100 text-green-800'
    if (msg.includes('fix') || msg.includes('bug')) return 'bg-red-100 text-red-800'
    if (msg.includes('refactor')) return 'bg-blue-100 text-blue-800'
    if (msg.includes('doc')) return 'bg-purple-100 text-purple-800'
    if (msg.includes('test')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const handleAnalysisComplete = (results) => {
    setAnalysisResults(results)
    // Could navigate to bullet point generation here
    console.log('Analysis completed:', results)
  }

  const startAnalysis = () => {
    if (commits.length === 0) {
      setError('No commits to analyze. Please fetch some commits first.')
      return
    }
    setShowAnalysis(true)
  }

  // Show loading if repository is not yet set
  if (!repository) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading repository...</p>
          </div>
        </div>
      </div>
    )
  }

  if (showAnalysis) {
    return (
      <CommitAnalysisView 
        commits={commits}
        onAnalysisComplete={handleAnalysisComplete}
        onBack={() => setShowAnalysis(false)}
        repository={repository}
      />
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title="Back to repositories"
          >
            <ArrowLeft className="h-4 w-4 text-gray-600" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Analyze Commits
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {repository.full_name} • {repository.default_branch}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <button
            onClick={() => setFilters({ ...getDefaultDates(), author: '', page: 1 })}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Reset to Default
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Since Date
            </label>
            <input
              type="date"
              value={filters.since}
              onChange={(e) => handleFilterChange('since', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="text-xs text-gray-500 mt-1">Default: Last 6 months</div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Until Date
            </label>
            <input
              type="date"
              value={filters.until}
              onChange={(e) => handleFilterChange('until', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <div className="text-xs text-gray-500 mt-1">Default: Today</div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Author
            </label>
            <select
              value={filters.author}
              onChange={(e) => handleFilterChange('author', e.target.value)}
              disabled={loadingContributors}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value="">All Authors</option>
              {contributors.map((contributor) => (
                <option key={contributor.login} value={contributor.login}>
                  {contributor.name} ({contributor.contributions} commits)
                </option>
              ))}
            </select>
            {loadingContributors && (
              <div className="text-xs text-gray-500 mt-1">Loading contributors...</div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.total_commits}</div>
            <div className="text-sm text-gray-600">Commits</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600">+{stats.total_additions}</div>
            <div className="text-sm text-gray-600">Lines Added</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">-{stats.total_deletions}</div>
            <div className="text-sm text-gray-600">Lines Removed</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_files_changed}</div>
            <div className="text-sm text-gray-600">Files Changed</div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-red-800 font-medium text-sm mb-1">Unable to load repository</h4>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
            <button
              onClick={onBack}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Commits List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">
            Commits {commits.length > 0 && `(${commits.length})`}
          </h3>
          {commits.length > 0 && (
            <button 
              onClick={startAnalysis}
              className="text-sm bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
            >
              <Brain className="h-4 w-4" />
              <span>Analyze with AI</span>
            </button>
          )}
        </div>

        {loading && commits.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {commits.map((commit) => (
              <div key={commit.sha} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <GitCommit className="h-4 w-4 text-gray-400" />
                      <span className="font-mono text-xs text-gray-500">
                        {commit.sha.substring(0, 7)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getCommitTypeColor(commit.message)}`}>
                        {commit.message.split(':')[0] || 'commit'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                      {commit.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{commit.author.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(commit.timestamp)}</span>
                      </span>
                      {commit.stats.total > 0 && (
                        <span className="flex items-center space-x-1">
                          <BarChart3 className="h-3 w-3" />
                          <span className="text-green-600">+{commit.stats.additions}</span>
                          <span className="text-red-600">-{commit.stats.deletions}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination?.has_next && (
          <div className="text-center pt-4">
            <button
              onClick={loadMoreCommits}
              disabled={loading}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load More Commits'}
            </button>
          </div>
        )}

        {commits.length === 0 && !loading && !error && (
          <div className="text-center py-12 text-gray-500">
            <GitCommit className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No commits found matching your criteria.</p>
            <p className="text-sm mt-1">Try adjusting your filters or date range.</p>
          </div>
        )}
      </div>
    </div>
  )
}