/**
 * Commit data model with validation
 */
class Commit {
  constructor(data) {
    this.sha = this.validateSha(data.sha);
    this.message = this.validateMessage(data.message);
    this.author = this.validateAuthor(data.author);
    this.committer = data.committer || data.author;
    this.timestamp = this.validateTimestamp(data.timestamp);
    this.url = data.url || null;
    this.stats = this.validateStats(data.stats);
    this.files = this.validateFiles(data.files);
    this.parents = data.parents || [];
  }

  validateSha(sha) {
    if (!sha || typeof sha !== 'string' || sha.length < 7) {
      throw new Error('Invalid commit SHA');
    }
    return sha;
  }

  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid commit message');
    }
    return message.trim();
  }

  validateAuthor(author) {
    if (!author || !author.name || !author.email) {
      throw new Error('Invalid commit author');
    }
    return {
      name: author.name.trim(),
      email: author.email.trim(),
      login: author.login || null,
      avatar_url: author.avatar_url || null
    };
  }

  validateTimestamp(timestamp) {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid commit timestamp');
    }
    return date.toISOString();
  }

  validateStats(stats) {
    return {
      additions: Math.max(0, parseInt(stats?.additions) || 0),
      deletions: Math.max(0, parseInt(stats?.deletions) || 0),
      total: Math.max(0, parseInt(stats?.total) || 0)
    };
  }

  validateFiles(files) {
    if (!Array.isArray(files)) {
      return [];
    }

    return files.map(file => ({
      filename: file.filename || '',
      status: this.validateFileStatus(file.status),
      additions: Math.max(0, parseInt(file.additions) || 0),
      deletions: Math.max(0, parseInt(file.deletions) || 0),
      changes: Math.max(0, parseInt(file.changes) || 0),
      patch: file.patch || null,
      previous_filename: file.previous_filename || null
    }));
  }

  validateFileStatus(status) {
    const validStatuses = ['added', 'modified', 'removed', 'renamed'];
    return validStatuses.includes(status) ? status : 'modified';
  }

  /**
   * Get the primary language of this commit based on file extensions
   */
  getPrimaryLanguage() {
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
      '.kt': 'Kotlin'
    };

    const languageCounts = {};
    
    this.files.forEach(file => {
      const ext = '.' + file.filename.split('.').pop().toLowerCase();
      const language = languageExtensions[ext];
      if (language) {
        languageCounts[language] = (languageCounts[language] || 0) + file.changes;
      }
    });

    const sortedLanguages = Object.entries(languageCounts)
      .sort(([,a], [,b]) => b - a);

    return sortedLanguages.length > 0 ? sortedLanguages[0][0] : 'Unknown';
  }

  /**
   * Determine the type of commit based on message and files
   */
  getCommitType() {
    const message = this.message.toLowerCase();
    
    // Check conventional commit patterns
    if (message.startsWith('feat') || message.includes('feature')) return 'feature';
    if (message.startsWith('fix') || message.includes('bug')) return 'bugfix';
    if (message.startsWith('refactor')) return 'refactor';
    if (message.startsWith('docs') || message.includes('documentation')) return 'documentation';
    if (message.startsWith('test')) return 'test';
    if (message.startsWith('style') || message.includes('formatting')) return 'style';
    if (message.startsWith('perf') || message.includes('performance')) return 'performance';
    if (message.startsWith('chore')) return 'chore';

    // Analyze based on message content
    if (message.includes('add') || message.includes('implement') || message.includes('create')) {
      return 'feature';
    }
    if (message.includes('fix') || message.includes('resolve') || message.includes('correct')) {
      return 'bugfix';
    }
    if (message.includes('update') || message.includes('improve') || message.includes('enhance')) {
      return 'improvement';
    }
    if (message.includes('remove') || message.includes('delete') || message.includes('clean')) {
      return 'cleanup';
    }

    return 'other';
  }

  /**
   * Check if this commit is trivial (should be filtered out)
   */
  isTrivial() {
    const message = this.message.toLowerCase();
    const trivialPatterns = [
      'merge',
      'initial commit',
      'gitignore',
      'readme',
      'typo',
      'whitespace',
      'formatting',
      'lint',
      'version bump',
      'update dependencies'
    ];

    // Check for trivial message patterns
    if (trivialPatterns.some(pattern => message.includes(pattern))) {
      return true;
    }

    // Check for very small changes
    if (this.stats.total < 5 && this.files.length <= 1) {
      return true;
    }

    // Check for only config/meta file changes
    const configFiles = ['.gitignore', 'package.json', 'package-lock.json', 'yarn.lock', 'README.md'];
    const onlyConfigChanges = this.files.length > 0 && 
      this.files.every(file => configFiles.some(config => file.filename.includes(config)));

    return onlyConfigChanges;
  }

  /**
   * Get a summary of this commit for analysis
   */
  getSummary() {
    return {
      sha: this.sha.substring(0, 7),
      type: this.getCommitType(),
      language: this.getPrimaryLanguage(),
      impact: this.stats.total,
      files_changed: this.files.length,
      is_trivial: this.isTrivial(),
      message_preview: this.message.substring(0, 100)
    };
  }
}

module.exports = Commit;