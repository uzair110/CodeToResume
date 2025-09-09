const express = require('express');
const axios = require('axios');
const { requireAuth } = require('./auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get user repositories
router.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        'Authorization': `token ${req.githubToken}`,
        'User-Agent': 'Commit-Resume-Generator'
      },
      params: {
        sort: 'updated',
        per_page: 100,
        type: 'all'
      }
    });

    const repositories = response.data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      default_branch: repo.default_branch,
      updated_at: repo.updated_at,
      language: repo.language,
      url: repo.html_url
    }));

    res.json({
      repositories,
      total: repositories.length
    });

  } catch (error) {
    console.error('Repository fetch error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'GitHub token expired or invalid' });
    }
    
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
});

// Get repository details
router.get('/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `token ${req.githubToken}`,
        'User-Agent': 'Commit-Resume-Generator'
      }
    });

    const repository = {
      id: response.data.id,
      name: response.data.name,
      full_name: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      default_branch: response.data.default_branch,
      updated_at: response.data.updated_at,
      language: response.data.language,
      url: response.data.html_url
    };

    res.json({ repository });

  } catch (error) {
    console.error('Repository details error:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    
    if (error.response?.status === 401) {
      return res.status(401).json({ message: 'Access denied to repository' });
    }
    
    res.status(500).json({ message: 'Failed to fetch repository details' });
  }
});

module.exports = router;