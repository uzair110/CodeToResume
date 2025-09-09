/**
 * Abstract base class for Git providers
 * Defines the interface that all Git providers must implement
 */
class BaseGitProvider {
  constructor(credentials) {
    if (this.constructor === BaseGitProvider) {
      throw new Error("BaseGitProvider is abstract and cannot be instantiated");
    }
    this.credentials = credentials;
  }

  /**
   * Authenticate with the Git provider
   * @param {Object} credentials - Authentication credentials
   * @returns {Promise<boolean>} - Success status
   */
  async authenticate(credentials) {
    throw new Error("authenticate method must be implemented");
  }

  /**
   * List repositories for the authenticated user
   * @param {Object} options - Listing options (sort, type, etc.)
   * @returns {Promise<Array>} - Array of repository objects
   */
  async listRepositories(options = {}) {
    throw new Error("listRepositories method must be implemented");
  }

  /**
   * Fetch commits from a specific repository
   * @param {string} repositoryId - Repository identifier
   * @param {Object} options - Fetch options (date range, author, etc.)
   * @returns {Promise<Array>} - Array of commit objects
   */
  async fetchCommits(repositoryId, options = {}) {
    throw new Error("fetchCommits method must be implemented");
  }

  /**
   * Validate repository accessibility
   * @param {string} repositoryUrl - Repository URL or identifier
   * @returns {Promise<boolean>} - Accessibility status
   */
  async validateRepository(repositoryUrl) {
    throw new Error("validateRepository method must be implemented");
  }

  /**
   * Get repository details
   * @param {string} repositoryId - Repository identifier
   * @returns {Promise<Object>} - Repository details
   */
  async getRepositoryDetails(repositoryId) {
    throw new Error("getRepositoryDetails method must be implemented");
  }
}

module.exports = BaseGitProvider;
