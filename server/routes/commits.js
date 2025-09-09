const express = require('express');
const { requireAuth } = require('./auth');
const GitProviderFactory = require('../services/GitProviderFactory');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get commits from a repository
router.get('/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const {
      since,
      until,
      author,
      per_page = 30,
      page = 1,
      sha
    } = req.query;

    // Create GitHub provider instance
    const provider = GitProviderFactory.createProvider('github', req.githubToken);

    // Validate date parameters
    const options = {
      per_page: Math.min(parseInt(per_page) || 30, 100),
      page: parseInt(page) || 1
    };

    if (since) {
      const sinceDate = new Date(since);
      if (isNaN(sinceDate.getTime())) {
        return res.status(400).json({ message: 'Invalid since date format' });
      }
      options.since = sinceDate.toISOString();
    }

    if (until) {
      const untilDate = new Date(until);
      if (isNaN(untilDate.getTime())) {
        return res.status(400).json({ message: 'Invalid until date format' });
      }
      options.until = untilDate.toISOString();
    }

    if (author && author.trim()) {
      options.author = author.trim();
      console.log('Filtering commits by author:', options.author);
    }

    if (sha && sha.trim()) {
      options.sha = sha.trim();
    }

    const result = await provider.fetchCommits(owner, repo, options);

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      commits: result.commits,
      pagination: result.pagination,
      filters: {
        since: options.since || null,
        until: options.until || null,
        author: options.author || null,
        sha: options.sha || null
      }
    });

  } catch (error) {
    console.error('Commit fetch error:', error.message);
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return res.status(404).json({ message: 'Repository not found or no commits match the criteria' });
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return res.status(401).json({ message: 'Access denied to repository' });
    }
    
    if (error.message.includes('403') || error.message.includes('rate limit')) {
      return res.status(403).json({ 
        message: 'API rate limit exceeded. Please try again later.' 
      });
    }
    
    res.status(500).json({ message: error.message || 'Failed to fetch commits' });
  }
});

// Get repository contributors
router.get('/:owner/:repo/contributors', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    // Create GitHub provider instance
    const provider = GitProviderFactory.createProvider('github', req.githubToken);
    
    const contributors = await provider.getRepositoryContributors(owner, repo);
    
    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      contributors
    });

  } catch (error) {
    console.error('Contributors fetch error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to fetch contributors' });
  }
});

// Get commit statistics for a repository
router.get('/:owner/:repo/stats', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { since, until, author } = req.query;

    // Create GitHub provider instance
    const provider = GitProviderFactory.createProvider('github', req.githubToken);

    // Fetch commits with filters to get stats
    const options = { per_page: 100 };
    
    if (since) {
      const sinceDate = new Date(since);
      if (!isNaN(sinceDate.getTime())) {
        options.since = sinceDate.toISOString();
      }
    }

    if (until) {
      const untilDate = new Date(until);
      if (!isNaN(untilDate.getTime())) {
        options.until = untilDate.toISOString();
      }
    }

    if (author && author.trim()) {
      options.author = author.trim();
    }

    const result = await provider.fetchCommits(owner, repo, options);
    const commits = result.commits;

    // Calculate statistics
    const stats = {
      total_commits: commits.length,
      total_additions: commits.reduce((sum, commit) => sum + (commit.stats.additions || 0), 0),
      total_deletions: commits.reduce((sum, commit) => sum + (commit.stats.deletions || 0), 0),
      total_files_changed: commits.reduce((sum, commit) => sum + (commit.files?.length || 0), 0),
      authors: [...new Set(commits.map(commit => commit.author.name))].length,
      date_range: {
        earliest: commits.length > 0 ? commits[commits.length - 1].timestamp : null,
        latest: commits.length > 0 ? commits[0].timestamp : null
      },
      languages: getLanguagesFromCommits(commits),
      commit_types: analyzeCommitTypes(commits)
    };

    res.json({
      success: true,
      repository: `${owner}/${repo}`,
      stats,
      filters: {
        since: options.since || null,
        until: options.until || null,
        author: options.author || null
      }
    });

  } catch (error) {
    console.error('Commit stats error:', error.message);
    res.status(500).json({ message: error.message || 'Failed to fetch commit statistics' });
  }
});

// Helper function to extract languages from commit files
function getLanguagesFromCommits(commits) {
  const languageExtensions = {
    '.js': 'JavaScript',
    '.jsx': 'JavaScript',
    '.ts': 'TypeScript',
    '.tsx': 'TypeScript',
    '.py': 'Python',
    '.java': 'Java',
    '.cpp': 'C++',
    '.c': 'C',
    '.cs': 'C#',
    '.php': 'PHP',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.scala': 'Scala',
    '.html': 'HTML',
    '.css': 'CSS',
    '.scss': 'SCSS',
    '.sass': 'SASS',
    '.vue': 'Vue',
    '.sql': 'SQL',
    '.sh': 'Shell',
    '.yml': 'YAML',
    '.yaml': 'YAML',
    '.json': 'JSON',
    '.xml': 'XML',
    '.md': 'Markdown'
  };

  const languages = {};
  
  commits.forEach(commit => {
    commit.files?.forEach(file => {
      const ext = '.' + file.filename.split('.').pop().toLowerCase();
      const language = languageExtensions[ext];
      if (language) {
        languages[language] = (languages[language] || 0) + (file.changes || 0);
      }
    });
  });

  return Object.entries(languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([language, changes]) => ({ language, changes }));
}

// Helper function to analyze commit message types
function analyzeCommitTypes(commits) {
  const types = {
    feature: 0,
    fix: 0,
    refactor: 0,
    docs: 0,
    style: 0,
    test: 0,
    chore: 0,
    other: 0
  };

  commits.forEach(commit => {
    const message = commit.message.toLowerCase();
    
    if (message.includes('feat') || message.includes('add') || message.includes('implement')) {
      types.feature++;
    } else if (message.includes('fix') || message.includes('bug') || message.includes('resolve')) {
      types.fix++;
    } else if (message.includes('refactor') || message.includes('restructure') || message.includes('cleanup')) {
      types.refactor++;
    } else if (message.includes('doc') || message.includes('readme') || message.includes('comment')) {
      types.docs++;
    } else if (message.includes('style') || message.includes('format') || message.includes('lint')) {
      types.style++;
    } else if (message.includes('test') || message.includes('spec')) {
      types.test++;
    } else if (message.includes('chore') || message.includes('update') || message.includes('bump')) {
      types.chore++;
    } else {
      types.other++;
    }
  });

  return types;
}

module.exports = router;