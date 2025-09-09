import { useState, useEffect } from 'react'
import { Search, GitBranch, Lock, Globe } from 'lucide-react'
import api from '../services/api'

export default function RepositorySelector() {
  const [repositories, setRepositories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRepo, setSelectedRepo] = useState(null)

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      const response = await api.get('/repositories')
      setRepositories(response.data.repositories)
    } catch (error) {
      console.error('Failed to fetch repositories:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRepos = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRepoSelect = (repo) => {
    setSelectedRepo(repo)
    // TODO: Navigate to commit analysis
    console.log('Selected repository:', repo)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {filteredRepos.map((repo) => (
          <div
            key={repo.id}
            onClick={() => handleRepoSelect(repo)}
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
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
                </div>
                {repo.description && (
                  <p className="text-sm text-gray-600 mt-1">{repo.description}</p>
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

      {filteredRepos.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No repositories found matching your search.</p>
        </div>
      )}
    </div>
  )
}