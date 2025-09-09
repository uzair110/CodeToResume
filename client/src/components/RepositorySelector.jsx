import { useState, useEffect } from 'react'
import { Search, GitBranch, Lock, Globe, Filter, AlertCircle, ArrowLeft } from 'lucide-react'
import api from '../services/api'

export default function RepositorySelector({ onBack, onRepositorySelect }) {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRepo, setSelectedRepo] = useState(null)
  const [sortBy, setSortBy] = useState('updated')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      setError('')
      const response = await api.get('/repositories', {
        params: {
          sort: sortBy,
          type: filterType
        }
      })
      setRepositories(response.data.repositories)
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
      setError(error.response?.data?.message || 'Failed to fetch repositories')
    } finally {
      setLoading(false)
    }
  }

  // Enhanced filtering logic
  const filteredRepos = repositories
    .filter(repo => {
      // Text search
      const matchesSearch = searchTerm === '' || 
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        repo.language?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Type filter
      const matchesType = filterType === 'all' ||
        (filterType === 'public' && !repo.private) ||
        (filterType === 'private' && repo.private)
      
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'updated':
          return new Date(b.updated_at) - new Date(a.updated_at)
        case 'language':
          return (a.language || '').localeCompare(b.language || '')
        default:
          return 0
      }
    })

  const handleRepoSelect = async (repo) => {
    try {
      setSelectedRepo(repo)
      
      // Validate repository access
      const response = await api.get(`/repositories/${repo.full_name.split('/')[0]}/${repo.full_name.split('/')[1]}`)
      
      if (response.data.repository) {
        // Navigate to commit analysis
        if (onRepositorySelect) {
          onRepositorySelect(repo)
        }
      }
    } catch (error) {
      console.error('Repository validation failed:', error)
      setError(`Failed to access repository: ${error.response?.data?.message || 'Unknown error'}`)
    }
  }

  // Refetch when sort or filter changes
  useEffect(() => {
    if (repositories.length > 0) {
      // Don't refetch, just re-sort/filter existing data
      return
    }
    fetchRepositories()
  }, [sortBy, filterType])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="Back to home"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Repository
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Choose a repository to analyze for resume bullet points
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search repositories by name, description, or language..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Repositories</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="updated">Last Updated</option>
              <option value="name">Name</option>
              <option value="language">Language</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Repository List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{filteredRepos.length} repositories</span>
          {selectedRepo && (
            <span className="text-primary-600 font-medium">
              Selected: {selectedRepo.name}
            </span>
          )}
        </div>
        
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              onClick={() => handleRepoSelect(repo)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedRepo?.id === repo.id
                  ? 'border-primary-500 bg-primary-50 shadow-sm'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{repo.name}</h3>
                    {repo.private ? (
                      <Lock className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Globe className="h-4 w-4 text-gray-400" />
                    )}
                    {repo.language && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        {repo.language}
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{repo.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center space-x-1">
                      <GitBranch className="h-3 w-3" />
                      <span>{repo.default_branch}</span>
                    </span>
                    <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredRepos.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No repositories found matching your search.</p>
        </div>
      )}
      </div>
    </div>
  )
}