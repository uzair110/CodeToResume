const GitHubProvider = require('./providers/GitHubProvider');

class GitProviderFactory {
  static createProvider(type, credentials) {
    switch (type.toLowerCase()) {
      case 'github':
        return new GitHubProvider(credentials);
      default:
        throw new Error(`Unsupported git provider: ${type}`);
    }
  }

  static getSupportedProviders() {
    return ['github'];
  }
}

module.exports = GitProviderFactory;