import React, { useState } from "react";

const CommitAnalysisView = ({ commits, onAnalysisComplete, onBack }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const generateBulletPoints = async () => {
    if (!commits || commits.length === 0) {
      setError("No commits to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Filter and optimize commits before sending
      const optimizedCommits = filterAndOptimizeCommits(commits);

      console.log(
        `Optimized ${commits.length} commits to ${optimizedCommits.length} for analysis`
      );

      const response = await fetch("/api/analysis/generate-bullets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ commits: optimizedCommits }),
      });

      if (!response.ok) {
        throw new Error(
          `Bullet point generation failed: ${response.statusText}`
        );
      }

      const results = await response.json();
      setAnalysisResults(results);

      if (onAnalysisComplete) {
        onAnalysisComplete(results);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filterAndOptimizeCommits = (commits) => {
    return commits
      .filter((commit) => {
        // Filter out obviously trivial commits on frontend
        const message = commit.message.toLowerCase();

        // Skip merge commits
        if (message.startsWith("merge ") || message.includes("merge branch")) {
          return false;
        }

        // Skip trivial patterns
        const trivialPatterns = [
          /^(fix|update|remove|delete)\s+(whitespace|spacing|indentation)/,
          /^(add|remove|update)\s+(comment|comments)/,
          /^(fix|update)\s+(typo|typos)/,
          /^(update|fix)\s+(formatting|format)/,
          /^\.gitignore/,
          /^readme/i,
          /^initial\s+commit$/,
          /^wip/i,
          /^work in progress/i,
        ];

        if (trivialPatterns.some((pattern) => pattern.test(message))) {
          return false;
        }

        // Skip very small changes (likely trivial)
        if (commit.stats.additions + commit.stats.deletions < 3) {
          return false;
        }

        return true;
      })
      .slice(0, 20) // Limit to 20 most recent significant commits
      .map((commit) => ({
        // Only send essential data to reduce payload size
        sha: commit.sha,
        message: commit.message,
        author: {
          name: commit.author.name,
        },
        timestamp: commit.timestamp,
        stats: {
          additions: commit.stats.additions,
          deletions: commit.stats.deletions,
        },
        files: (commit.files || []).slice(0, 5).map((file) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          // Include meaningful patch content for analysis
          patch: file.patch ? file.patch.substring(0, 300) : "",
        })),
      }));
  };

  const renderAnalysisSummary = () => {
    if (!analysisResults) return null;

    const { summary } = analysisResults;

    return (
      <div className="analysis-summary">
        <h3>Bullet Point Generation Summary</h3>
        <div className="summary-stats">
          <div className="stat">
            <span className="label">Total Commits:</span>
            <span className="value">{summary.total}</span>
          </div>
          <div className="stat">
            <span className="label">Processed:</span>
            <span className="value">{summary.processed}</span>
          </div>
          <div className="stat">
            <span className="label">Bullet Points:</span>
            <span className="value">{summary.bulletPointsGenerated}</span>
          </div>
          <div className="stat">
            <span className="label">Trivial Skipped:</span>
            <span className="value">{summary.trivial}</span>
          </div>
          <div className="stat">
            <span className="label">Categories:</span>
            <span className="value">{summary.categories}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderBulletPointGroups = () => {
    if (!analysisResults?.groups) return null;

    // Check if there are any bullet points at all
    const totalBulletPoints = analysisResults.summary?.bulletPointsGenerated || 0;
    
    if (totalBulletPoints === 0) {
      return (
        <div className="no-bullet-points">
          <div className="no-results-icon">📝</div>
          <h3>No Resume Bullet Points Generated</h3>
          <p>We couldn't generate any meaningful bullet points from your commits. This might happen because:</p>
          <ul>
            <li>All commits in the selected date range were trivial (formatting, typos, etc.)</li>
            <li>The commits don't contain substantial code changes</li>
            <li>The date range is too narrow</li>
          </ul>
          <div className="suggestions">
            <h4>Try these suggestions:</h4>
            <ul>
              <li>Expand your date range to include more commits</li>
              <li>Select a different repository with more substantial changes</li>
              <li>Check if you have commits with meaningful code changes</li>
            </ul>
          </div>
        </div>
      );
    }

    return (
      <div className="bullet-point-groups">
        <div className="bullet-points-header">
          <h3>Generated Resume Bullet Points</h3>
          {totalBulletPoints < 3 && (
            <div className="few-results-notice">
              <span>💡 Only {totalBulletPoints} bullet point{totalBulletPoints !== 1 ? 's' : ''} generated. Try expanding your date range for more results.</span>
            </div>
          )}
        </div>
        {analysisResults.groups.map((group, index) => (
          <div key={index} className="bullet-group">
            <div className="group-header">
              <h4>{group.category}</h4>
              <span className="bullet-count">{group.count} bullet points</span>
            </div>

            <div className="bullet-points-list">
              {group.bulletPoints.map((bullet, bulletIndex) => (
                <div key={bulletIndex} className="bullet-point-item">
                  <div className="bullet-text">• {bullet.text}</div>
                  <div className="bullet-meta">
                    <span className="action-verb">
                      Action: {bullet.actionVerb}
                    </span>
                    <span className="business-impact">
                      Impact: {bullet.businessImpact}
                    </span>
                    <span className="confidence">
                      Confidence: {Math.round(bullet.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Export Functions
  const getAllBulletPointsText = () => {
    if (!analysisResults?.groups) return "";

    let text = "Resume Bullet Points\n\n";

    analysisResults.groups.forEach((group, index) => {
      text += `${group.category}:\n`;
      group.bulletPoints.forEach((bullet) => {
        text += `• ${bullet.text}\n`;
      });
      if (index < analysisResults.groups.length - 1) {
        text += "\n";
      }
    });

    return text;
  };

  const copyToClipboard = async () => {
    try {
      const text = getAllBulletPointsText();
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = getAllBulletPointsText();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const exportAsMarkdown = () => {
    if (!analysisResults?.groups) return;

    let markdown = "# Resume Bullet Points\n\n";

    analysisResults.groups.forEach((group) => {
      markdown += `## ${group.category}\n\n`;
      group.bulletPoints.forEach((bullet) => {
        markdown += `- ${bullet.text}\n`;
      });
      markdown += "\n";
    });

    // Add metadata
    markdown += "---\n\n";
    markdown += `Generated on: ${new Date().toLocaleDateString()}\n`;
    markdown += `Total bullet points: ${analysisResults.summary.bulletPointsGenerated}\n`;
    markdown += `Categories: ${analysisResults.summary.categories}\n`;

    // Create and download file
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resume-bullet-points-${
      new Date().toISOString().split("T")[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    if (!analysisResults?.groups) return;

    // Create HTML content for PDF
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Resume Bullet Points</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
          }
          h1 { 
            color: #2c3e50; 
            border-bottom: 2px solid #3498db; 
            padding-bottom: 10px;
          }
          h2 { 
            color: #34495e; 
            margin-top: 30px;
            margin-bottom: 15px;
          }
          ul { 
            padding-left: 20px; 
          }
          li { 
            margin-bottom: 8px; 
            line-height: 1.5;
          }
          .metadata {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 12px;
            color: #7f8c8d;
          }
        </style>
      </head>
      <body>
        <h1>Resume Bullet Points</h1>
    `;

    analysisResults.groups.forEach((group) => {
      htmlContent += `<h2>${group.category}</h2><ul>`;
      group.bulletPoints.forEach((bullet) => {
        htmlContent += `<li>${bullet.text}</li>`;
      });
      htmlContent += "</ul>";
    });

    htmlContent += `
        <div class="metadata">
          <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Total bullet points:</strong> ${
            analysisResults.summary.bulletPointsGenerated
          }</p>
          <p><strong>Categories:</strong> ${
            analysisResults.summary.categories
          }</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Trigger print dialog after content loads
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="commit-analysis-view">
      <div className="analysis-header">
        <div className="header-with-back">
          <div className="header-content">
            <h2>Resume Bullet Point Generator</h2>
            <p>
              Transform your commits into professional resume bullet points with
              business impact
            </p>
          </div>
        </div>
      </div>

      {!analysisResults && (
        <div className="analysis-start">
          <p>
            Ready to generate resume bullet points from {commits?.length || 0}{" "}
            commits
          </p>
          <p className="optimization-note">
            <small>
              Note: We'll automatically filter out trivial commits and limit to
              the 20 most significant ones for optimal results.
            </small>
          </p>
          <button
            onClick={generateBulletPoints}
            disabled={isAnalyzing || !commits?.length}
            className="analyze-button"
          >
            {isAnalyzing ? "Generating..." : "Generate Bullet Points"}
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="analysis-progress">
          <div className="progress-indicator">
            <div className="spinner"></div>
            <p>Generating professional bullet points with AI...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <h3>Analysis Error</h3>
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {analysisResults && (
        <div className="analysis-results">
          {renderAnalysisSummary()}
          {renderBulletPointGroups()}

          <div className="next-steps">
            {analysisResults.summary?.bulletPointsGenerated > 0 ? (
              <>
                <h3>Export Your Bullet Points</h3>
                <p>
                  Your professional resume bullet points are ready! Copy them to
                  your resume or export in different formats.
                </p>
                <div className="export-buttons">
                  <button
                    onClick={() => copyToClipboard()}
                    className={`export-button ${copySuccess ? "copy-success" : ""}`}
                  >
                    {copySuccess ? "✓ Copied!" : "Copy All Text"}
                  </button>
                  <button
                    onClick={() => exportAsMarkdown()}
                    className="export-button"
                  >
                    Export as Markdown
                  </button>
                  <button onClick={() => exportAsPDF()} className="export-button">
                    Export as PDF
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Try Different Settings</h3>
                <p>
                  No bullet points were generated from your current selection. Try adjusting your filters or selecting a different repository.
                </p>
              </>
            )}
            <div className="navigation-buttons">
              <button
                onClick={() => setAnalysisResults(null)}
                className="try-again-button"
              >
                {analysisResults.summary?.bulletPointsGenerated > 0 ? 'Generate New Analysis' : 'Try Different Commits'}
              </button>
              <button onClick={onBack} className="back-to-commits-button">
                Back to Commits
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommitAnalysisView;
