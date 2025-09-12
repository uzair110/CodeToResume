const ClaudeService = require("./ClaudeService");

class CommitAnalyzer {
  constructor() {
    this.claudeService = new ClaudeService();
  }

  async generateBulletPoints(commits) {
    console.log(`Analyzing ${commits.length} commits for overall context`);

    // Filter out trivial commits first
    const significantCommits = commits.filter(commit => !this.isObviouslyTrivial(commit));
    
    if (significantCommits.length === 0) {
      return [{
        bulletPoints: [],
        isTrivial: true,
        reasoning: 'No significant commits found for analysis',
        processedAt: new Date()
      }];
    }

    try {
      // Analyze ALL commits together for context
      const bulletPointData = await this.claudeService.generateBulletPointsFromContext(significantCommits);
      
      return [{
        bulletPoints: bulletPointData.bulletPoints || [],
        isTrivial: bulletPointData.isTrivial || false,
        reasoning: bulletPointData.reasoning || 'Generated from overall commit context',
        processedAt: new Date(),
        commitsAnalyzed: significantCommits.length
      }];

    } catch (error) {
      console.error('Failed to generate bullet points from context:', error.message);
      return [{
        bulletPoints: [],
        isTrivial: false,
        error: error.message,
        processedAt: new Date()
      }];
    }
  }

  isObviouslyTrivial(commit) {
    const message = commit.message.toLowerCase();

    // Check for trivial commit patterns
    const trivialPatterns = [
      /^(fix|update|remove|delete)\s+(whitespace|spacing|indentation)/,
      /^(add|remove|update)\s+(comment|comments)/,
      /^(fix|update)\s+(typo|typos)/,
      /^(update|fix)\s+(formatting|format)/,
      /^merge\s+branch/,
      /^initial\s+commit$/,
      /^\.gitignore/,
      /^readme/i,
    ];

    if (trivialPatterns.some((pattern) => pattern.test(message))) {
      return true;
    }

    // Check if files exists and has data
    if (!commit.files || !Array.isArray(commit.files)) {
      // If no file data, check stats only
      return commit.stats && (commit.stats.additions + commit.stats.deletions) < 3;
    }

    // Check if only config/doc files changed
    const nonTrivialExtensions = [
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".go",
      ".rs",
      ".php",
    ];
    const hasCodeChanges = commit.files.some((file) =>
      nonTrivialExtensions.some((ext) => file.filename && file.filename.endsWith(ext))
    );

    if (
      !hasCodeChanges &&
      commit.stats &&
      commit.stats.additions + commit.stats.deletions < 10
    ) {
      return true;
    }

    return false;
  }

  createTrivialResult(commit) {
    return {
      commitId: commit.sha,
      commit: commit,
      bulletPoints: [],
      isTrivial: true,
      reasoning:
        "Trivial change (formatting, comments, or minor fixes) - not suitable for resume",
      processedAt: new Date(),
    };
  }

  createErrorResult(commit, error) {
    return {
      commitId: commit.sha,
      commit: commit,
      bulletPoints: [],
      isTrivial: false,
      error: error.message,
      processedAt: new Date(),
    };
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Filter out trivial results and get meaningful bullet points
  getSignificantBulletPoints(results) {
    const significantResults = results.filter(
      (result) =>
        !result.isTrivial &&
        result.bulletPoints &&
        result.bulletPoints.length > 0 &&
        !result.error
    );

    // Flatten all bullet points - only keep essential data
    const allBulletPoints = [];
    significantResults.forEach((result) => {
      result.bulletPoints.forEach((bullet) => {
        allBulletPoints.push({
          text: bullet.text,
          actionVerb: bullet.actionVerb,
          businessImpact: bullet.businessImpact,
          confidence: bullet.confidence
        });
      });
    });

    return allBulletPoints;
  }

  // Group bullet points by similar action verbs or business areas
  groupBulletPointsByCategory(bulletPoints) {
    const groups = new Map();

    for (const bullet of bulletPoints) {
      const category = this.categorizeBulletPoint(bullet);

      if (!groups.has(category)) {
        groups.set(category, {
          category: category,
          bulletPoints: [],
          count: 0,
        });
      }

      groups.get(category).bulletPoints.push(bullet);
      groups.get(category).count++;
    }

    return Array.from(groups.values()).sort((a, b) => b.count - a.count);
  }

  categorizeBulletPoint(bullet) {
    const actionVerb = bullet.actionVerb.toLowerCase();

    // Categorize by action type
    if (
      ["developed", "built", "created", "implemented", "designed"].includes(
        actionVerb
      )
    ) {
      return "Development & Implementation";
    } else if (
      ["optimized", "improved", "enhanced", "refactored"].includes(actionVerb)
    ) {
      return "Performance & Optimization";
    } else if (
      ["fixed", "resolved", "debugged", "corrected"].includes(actionVerb)
    ) {
      return "Problem Solving & Maintenance";
    } else if (
      ["integrated", "configured", "deployed", "established"].includes(
        actionVerb
      )
    ) {
      return "Integration & Deployment";
    } else if (["tested", "validated", "automated"].includes(actionVerb)) {
      return "Quality Assurance & Testing";
    } else {
      return "General Development";
    }
  }
}

module.exports = CommitAnalyzer;
