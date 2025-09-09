const express = require('express');
const { requireAuth } = require('./auth');
const GitProviderFactory = require('../services/GitProviderFactory');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Get user repositories
router.get('/', async (req, res) => {
  try {
    const { sort = 'updated', type = 'all', per_page = 100 } = req.query;
    
    // Create GitHub provider instance
    const provider = GitProviderFactory.createProvider('github', req.githubToken);
    
    // Validate parameters
    const validSorts = ['updated', 'created', 'pushed', 'full_name'];
    const validTypes = ['all', 'owner', 'public', 'private', 'member'];
    
    const options = {
      sort: validSorts.includes(sort) ? sort : 'updated',
      type: validTypes.includes(type) ? type : 'all',
      per_page: Math.min(parseInt(per_page) || 100, 100),
      direction: 'desc'
    };

    const repositories = await provider.listRepositories(options);

    res.json({
      repositories,
      total: repositories.length,
      sort: options.sort,
      type: options.type
    });

  } catch (error) {
    console.error('Repository fetch error:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return res.status(401).json({ message: 'GitHub token expired or invalid' });
    }
    
    if (error.message.includes('403') || error.message.includes('rate limit')) {
      return res.status(403).json({ 
        message: 'API rate limit exceeded. Please try again later.' 
      });
    }
    
    res.status(500).json({ message: error.message || 'Failed to fetch repositories' });
  }
});

// Get repository details
router.get('/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    
    // Create GitHub provider instance
    const provider = GitProviderFactory.createProvider('github', req.githubToken);
    
    const repository = await provider.getRepositoryDetails(owner, repo);

    res.json({ repository });

  } catch (error) {
    console.error('Repository details error:', error.message);
    
    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return res.status(404).json({ message: 'Repository not found' });
    }
    
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return res.status(401).json({ message: 'Access denied to repository' });
    }
    
    res.status(500).json({ message: error.message || 'Failed to fetch repository details' });
  }
});

module.exports = router;