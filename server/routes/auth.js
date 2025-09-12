const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// GitHub authentication
router.post('/github', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'GitHub token is required' });
    }

    // Verify token with GitHub API
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Commit-Resume-Generator'
      }
    });

    const user = response.data;

    // Store encrypted token in session
    req.session.user = {
      id: user.id,
      login: user.login,
      name: user.name,
      avatar_url: user.avatar_url
    };
    req.session.githubToken = encrypt(token);

    // Save session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ message: 'Session save failed' });
      }
      
      res.json({
        success: true,
        user: req.session.user
      });
    });

  } catch (error) {
    console.error('GitHub auth error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        message: 'Invalid GitHub token. Please check your token has repo and user scopes.',
        details: error.response?.data?.message 
      });
    }
    
    if (error.response?.status === 403) {
      return res.status(403).json({ 
        message: 'GitHub API rate limit exceeded. Please try again later.',
        details: error.response?.data?.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Authentication failed',
      details: error.message 
    });
  }
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session.user && req.session.githubToken) {
    res.json({
      authenticated: true,
      user: req.session.user
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
});

// Test GitHub token
router.post('/test-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'Commit-Resume-Generator'
      }
    });

    // Also check token scopes
    const scopes = response.headers['x-oauth-scopes'] || '';
    
    res.json({
      valid: true,
      user: response.data.login,
      scopes: scopes.split(', ').filter(s => s),
      rateLimit: {
        remaining: response.headers['x-ratelimit-remaining'],
        reset: response.headers['x-ratelimit-reset']
      }
    });

  } catch (error) {
    res.json({
      valid: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

// Middleware to check authentication
function requireAuth(req, res, next) {
  if (!req.session.user || !req.session.githubToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    req.githubToken = decrypt(req.session.githubToken);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid session' });
  }
}

module.exports = { router, requireAuth };