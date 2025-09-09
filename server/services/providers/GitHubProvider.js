const axios = require('axios');
const BaseGitProvider = require('./BaseGitProvider');

class GitHubProvider extends BaseGitProvider {
  constructor(token) {
    super({ token });
    this.token = token;
    this.baseURL = 'https://api.github.com';
    this.userAgent = 'Commit-Resume-Generator';
  }

  /**
   * Create axios instance with authentication headers
   */
  getAxiosInstance() {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `token ${this.token}`,
        'User-Agent': this.userAgent,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
  }

  /**
   * Authenticate with GitHub API
   */
  async authenticate(credentials) {
    try {
      const api = this.getAxiosInstance();
      const response = await api.get('/user');
      return {
        success: true,
        user: {
          id: response.data.id,
          login: response.data.login,
          name: response.data.name,
          avatar_url: response.data.avatar_url,
          email: response.data.email
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Authentication failed'
      };
    }
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepositories(options = {}) {
    try {
      const api = this.getAxiosInstance();
      const {
        sort = 'updated',
        type = 'all',
        per_page = 100,
        direction = 'desc'
      } = options;

      const response = await api.get('/user/repos', {
        params: {
          sort,
          type,
          per_page: Math.min(per_page, 100),
          direction
        }
      });

      return response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        private: repo.private,
        default_branch: repo.default_branch,
        updated_at: repo.updated_at,
        created_at: repo.created_at,
        language: repo.language,
        url: repo.html_url,
        size: repo.size,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url
        }
      }));
    } catch (error) {
      throw new Error(`Failed to fetch repositories: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get repository details
   */
  async getRepositoryDetails(owner, repo) {
    try {
      const api = this.getAxiosInstance();
      const response = await api.get(`/repos/${owner}/${repo}`);
      
      return {
        id: response.data.id,
        name: response.data.name,
        full_name: response.data.full_name,
        description: response.data.description,
        private: response.data.private,
        default_branch: response.data.default_branch,
        updated_at: response.data.updated_at,
        created_at: response.data.created_at,
        language: response.data.language,
        url: response.data.html_url,
        size: response.data.size,
        stargazers_count: response.data.stargazers_count,
        forks_count: response.data.forks_count,
        owner: {
          login: response.data.owner.login,
          avatar_url: response.data.owner.avatar_url
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch repository details: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Validate repository accessibility
   */
  async validateRepository(owner, repo) {
    try {
      await this.getRepositoryDetails(owner, repo);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch commits from repository (placeholder for future implementation)
   */
  async fetchCommits(repositoryId, options = {}) {
    // TODO: Implement in Task 3
    throw new Error('fetchCommits not yet implemented');
  }
}

module.exports = GitHubProvider;