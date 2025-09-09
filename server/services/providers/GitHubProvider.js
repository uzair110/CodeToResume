const axios = require("axios");
const BaseGitProvider = require("./BaseGitProvider");
const Commit = require("../../models/Commit");

class GitHubProvider extends BaseGitProvider {
  constructor(token) {
    super({ token });
    this.token = token;
    this.baseURL = "https://api.github.com";
    this.userAgent = "Commit-Resume-Generator";
  }

  /**
   * Create axios instance with authentication headers
   */
  getAxiosInstance() {
    return axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `token ${this.token}`,
        "User-Agent": this.userAgent,
        Accept: "application/vnd.github.v3+json",
      },
    });
  }

  /**
   * Authenticate with GitHub API
   */
  async authenticate(credentials) {
    try {
      const api = this.getAxiosInstance();
      const response = await api.get("/user");
      return {
        success: true,
        user: {
          id: response.data.id,
          login: response.data.login,
          name: response.data.name,
          avatar_url: response.data.avatar_url,
          email: response.data.email,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Authentication failed",
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
        sort = "updated",
        type = "all",
        per_page = 100,
        direction = "desc",
      } = options;

      const response = await api.get("/user/repos", {
        params: {
          sort,
          type,
          per_page: Math.min(per_page, 100),
          direction,
        },
      });

      return response.data.map((repo) => ({
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
          avatar_url: repo.owner.avatar_url,
        },
      }));
    } catch (error) {
      throw new Error(
        `Failed to fetch repositories: ${
          error.response?.data?.message || error.message
        }`
      );
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
          avatar_url: response.data.owner.avatar_url,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch repository details: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  /**
   * Get repository contributors
   */
  async getRepositoryContributors(owner, repo) {
    try {
      const api = this.getAxiosInstance();

      // Try to get contributors from GitHub API first
      let contributors = [];
      try {
        const response = await api.get(`/repos/${owner}/${repo}/contributors`, {
          params: {
            per_page: 100,
            anon: 1, // Include anonymous contributors
          },
        });

        contributors = response.data.map((contributor) => ({
          login: contributor.login || contributor.name || "Anonymous",
          name: contributor.name || contributor.login || "Anonymous",
          avatar_url: contributor.avatar_url || null,
          contributions: contributor.contributions,
          type: contributor.type || "User",
        }));
      } catch (contributorsError) {
        // Contributors API failed, falling back to commit analysis
      }

      // Also fetch recent commits to get all authors (fallback and supplement)
      try {
        const commitsResponse = await api.get(
          `/repos/${owner}/${repo}/commits`,
          {
            params: {
              per_page: 100,
            },
          }
        );

        // Extract unique authors from commits (only GitHub users with logins)
        const commitAuthors = new Map();
        commitsResponse.data.forEach((commit) => {
          const author = commit.author;
          const committer = commit.committer;

          // Add commit author (only if they have a GitHub login)
          if (author && author.login) {
            const existing = commitAuthors.get(author.login) || {
              login: author.login,
              name: author.login, // Will be updated with real name if available
              avatar_url: author.avatar_url,
              contributions: 0,
              type: "User",
            };
            existing.contributions++;
            // Update name if we have it
            if (commit.commit.author.name) {
              existing.name = commit.commit.author.name;
            }
            commitAuthors.set(author.login, existing);
          }

          // Add committer if different from author (only if they have a GitHub login)
          if (
            committer &&
            committer.login &&
            committer.login !== author?.login
          ) {
            const existing = commitAuthors.get(committer.login) || {
              login: committer.login,
              name: committer.login,
              avatar_url: committer.avatar_url,
              contributions: 0,
              type: "User",
            };
            existing.contributions++;
            // Update name if we have it
            if (commit.commit.committer.name) {
              existing.name = commit.commit.committer.name;
            }
            commitAuthors.set(committer.login, existing);
          }
        });

        // Merge with existing contributors
        const contributorsMap = new Map();

        // Add API contributors first
        contributors.forEach((contributor) => {
          contributorsMap.set(contributor.login, contributor);
        });

        // Add/update with commit authors
        commitAuthors.forEach((author, login) => {
          if (contributorsMap.has(login)) {
            // Update existing contributor
            const existing = contributorsMap.get(login);
            existing.contributions = Math.max(
              existing.contributions,
              author.contributions
            );
          } else {
            // Add new contributor from commits
            contributorsMap.set(login, author);
          }
        });

        contributors = Array.from(contributorsMap.values());
      } catch (commitsError) {
        // Failed to fetch commits for contributor analysis
      }

      // Sort by contributions (descending)
      return contributors.sort((a, b) => b.contributions - a.contributions);
    } catch (error) {
      throw new Error(
        `Failed to fetch contributors: ${
          error.response?.data?.message || error.message
        }`
      );
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
   * Fetch commits from repository
   */
  async fetchCommits(owner, repo, options = {}) {
    try {
      const api = this.getAxiosInstance();
      const {
        since,
        until,
        author,
        per_page = 100,
        page = 1,
        sha, // branch/commit SHA
      } = options;

      const params = {
        per_page: Math.min(per_page, 100),
        page,
      };

      // Add optional filters
      if (since) params.since = since;
      if (until) params.until = until;
      if (author) params.author = author;
      if (sha) params.sha = sha;

      const response = await api.get(`/repos/${owner}/${repo}/commits`, {
        params,
      });

      // Get detailed commit information including file changes
      const commits = await Promise.all(
        response.data.map(async (commit) => {
          try {
            // Fetch detailed commit info with file changes
            const detailResponse = await api.get(
              `/repos/${owner}/${repo}/commits/${commit.sha}`
            );

            const commitData = {
              sha: commit.sha,
              message: commit.commit.message,
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
                login: commit.author?.login || null,
                avatar_url: commit.author?.avatar_url || null,
              },
              committer: {
                name: commit.commit.committer.name,
                email: commit.commit.committer.email,
                login: commit.committer?.login || null,
              },
              timestamp: commit.commit.author.date,
              url: commit.html_url,
              stats: detailResponse.data.stats || {
                additions: 0,
                deletions: 0,
                total: 0,
              },
              files: (detailResponse.data.files || []).map((file) => ({
                filename: file.filename,
                status: file.status, // added, modified, removed, renamed
                additions: file.additions || 0,
                deletions: file.deletions || 0,
                changes: file.changes || 0,
                patch: file.patch || null,
                previous_filename: file.previous_filename || null,
              })),
              parents: commit.parents.map((parent) => ({
                sha: parent.sha,
                url: parent.url,
              })),
            };

            return new Commit(commitData);
          } catch (detailError) {
            // If we can't get detailed info, return basic commit info

            const basicCommitData = {
              sha: commit.sha,
              message: commit.commit.message,
              author: {
                name: commit.commit.author.name,
                email: commit.commit.author.email,
                login: commit.author?.login || null,
                avatar_url: commit.author?.avatar_url || null,
              },
              committer: {
                name: commit.commit.committer.name,
                email: commit.commit.committer.email,
                login: commit.committer?.login || null,
              },
              timestamp: commit.commit.author.date,
              url: commit.html_url,
              stats: { additions: 0, deletions: 0, total: 0 },
              files: [],
              parents: commit.parents.map((parent) => ({
                sha: parent.sha,
                url: parent.url,
              })),
            };

            return new Commit(basicCommitData);
          }
        })
      );

      return {
        commits,
        pagination: {
          page: parseInt(page),
          per_page: parseInt(per_page),
          has_next: response.data.length === per_page,
          total_count: response.headers["x-total-count"] || null,
        },
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch commits: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

module.exports = GitHubProvider;
