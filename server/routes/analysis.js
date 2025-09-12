const express = require("express");
const CommitAnalyzer = require("../services/CommitAnalyzer");

const router = express.Router();
const commitAnalyzer = new CommitAnalyzer();

// Generate bullet points endpoint
router.post("/generate-bullets", async (req, res) => {
  // Set a longer timeout for this endpoint
  req.setTimeout(300000); // 5 minutes

  try {
    const { commits } = req.body;

    if (!commits || !Array.isArray(commits)) {
      return res.status(400).json({
        error: "Invalid request: commits array is required",
      });
    }

    if (commits.length === 0) {
      return res.json({
        bulletPoints: [],
        groups: [],
        summary: {
          total: 0,
          processed: 0,
          trivial: 0,
          bulletPointsGenerated: 0,
        },
      });
    }

    // Limit commits to prevent overload
    const limitedCommits = commits.slice(0, 25);
    if (commits.length > 25) {
      console.log(
        `Limited commits from ${commits.length} to 25 for processing`
      );
    }

    // Generate bullet points for all commits
    const results = await commitAnalyzer.generateBulletPoints(limitedCommits);

    // Extract all significant bullet points
    const bulletPoints = commitAnalyzer.getSignificantBulletPoints(results);

    // Group bullet points by category
    const groups = commitAnalyzer.groupBulletPointsByCategory(bulletPoints);

    // Generate summary statistics
    const summary = {
      total: limitedCommits.length,
      originalTotal: commits.length,
      processed: results.filter((r) => !r.error).length,
      trivial: results.filter((r) => r.isTrivial).length,
      bulletPointsGenerated: bulletPoints.length,
      categories: groups.length,
    };

    res.json({
      bulletPoints,
      groups,
      summary,
    });
  } catch (error) {
    console.error("Bullet point generation error:", error);
    res.status(500).json({
      error: "Failed to generate bullet points",
      details: error.message,
    });
  }
});

// Get analysis status for long-running operations
router.get("/status/:sessionId", async (req, res) => {
  // This would be used for tracking progress of large analyses
  // For now, return a simple status
  res.json({
    status: "completed",
    message: "Analysis completed successfully",
  });
});

module.exports = router;
