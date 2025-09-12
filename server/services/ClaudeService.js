const axios = require("axios");

class ClaudeService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY;
    this.baseURL = "https://api.anthropic.com/v1/messages";
    this.model = "claude-sonnet-4-20250514";

    if (!this.apiKey) {
      throw new Error("CLAUDE_API_KEY environment variable is required");
    }
  }

  async generateBulletPoints(commit) {
    const prompt = this.buildBulletPointPrompt(commit);

    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
          timeout: 30000, // 30 second timeout
        }
      );

      return this.parseBulletPointResponse(response.data.content[0].text);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error(
          "Invalid Claude API key. Please check your CLAUDE_API_KEY environment variable."
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "Claude API rate limit exceeded. Please try again later."
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Claude API request timed out. Please try again.");
      }

      console.error("Claude API error:", error.response?.data || error.message);
      throw new Error(`Failed to analyze commit with Claude: ${error.message}`);
    }
  }

  async generateBulletPointsFromContext(commits) {
    const prompt = this.buildContextualPrompt(commits);

    try {
      const response = await axios.post(
        this.baseURL,
        {
          model: this.model,
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
          },
          timeout: 30000,
        }
      );

      return this.parseBulletPointResponse(response.data.content[0].text);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error(
          "Invalid Claude API key. Please check your CLAUDE_API_KEY environment variable."
        );
      } else if (error.response?.status === 429) {
        throw new Error(
          "Claude API rate limit exceeded. Please try again later."
        );
      } else if (error.code === "ECONNABORTED") {
        throw new Error("Claude API request timed out. Please try again.");
      }

      console.error("Claude API error:", error.response?.data || error.message);
      throw new Error(
        `Failed to analyze commits with Claude: ${error.message}`
      );
    }
  }

  buildContextualPrompt(commits) {
    // Analyze all commits together for overall context
    const allFiles = [];
    const allMessages = [];
    const technologies = new Set();
    const directories = new Set();
    let totalAdditions = 0;
    let totalDeletions = 0;

    commits.forEach((commit) => {
      allMessages.push(commit.message);
      totalAdditions += commit.stats?.additions || 0;
      totalDeletions += commit.stats?.deletions || 0;

      (commit.files || []).forEach((file) => {
        allFiles.push(file);

        // Extract technologies
        if (file.filename) {
          const ext = file.filename.split(".").pop();
          if (ext && ext.length < 5) {
            technologies.add(ext);
          }

          // Extract directories
          const parts = file.filename.split("/");
          if (parts.length > 1) {
            directories.add(parts[0]);
          }
        }
      });
    });

    // Get sample of most significant code changes
    const significantChanges = allFiles
      .filter((f) => f.patch && (f.additions > 5 || f.deletions > 5))
      .slice(0, 8)
      .map((f) => `${f.filename}: ${f.patch.substring(0, 150)}...`)
      .join("\n\n");

    return `You are a professional resume writer. Analyze this collection of Git commits and generate 2-4 high-level resume bullet points that summarize the overall work accomplished.

REQUIREMENTS:
- Generate 2-4 bullet points maximum (not per commit, but total)
- Focus on OVERALL achievements and business impact
- Start with strong action verbs (Developed, Implemented, Built, Optimized, etc.)
- Emphasize results and business value, not technical implementation
- Use quantifiable metrics when possible
- Keep language accessible to non-technical recruiters
- Each bullet point should be 1-2 lines maximum
- Include relevant domain context when clear from commit messages and code (e.g., medical imaging, neuroscience, finance, etc.)
- Balance domain specificity with broad appeal - mention the field but emphasize transferable skills

OVERALL WORK CONTEXT:
Total Commits: ${commits.length}
Total Changes: +${totalAdditions}/-${totalDeletions} lines
Technologies: ${Array.from(technologies).join(", ")}
Areas: ${Array.from(directories).slice(0, 5).join(", ")}

COMMIT MESSAGES:
${allMessages.slice(0, 10).join("\n")}

KEY CODE CHANGES:
${significantChanges || "No significant code changes detected"}

DOMAIN ANALYSIS:
Carefully analyze commit messages, file names, and code for domain-specific terms:
- Medical/Healthcare: brain, neuron, medical, imaging, TIFF, DICOM, annotation, microscopy, pathology
- Finance: trading, portfolio, market, transaction, payment, banking, cryptocurrency
- E-commerce: cart, checkout, product, inventory, order, shipping, customer
- Gaming: game, player, level, score, physics, rendering, animation
- IoT/Hardware: sensor, device, firmware, embedded, signal, measurement
- AI/ML: model, training, prediction, classification, neural, algorithm

If domain terms are found, structure bullet points as: "Developed [domain-specific application] with [technical capabilities] that [business impact]"
Example: "Built neuroscience data annotation platform with real-time 3D visualization that accelerated research workflows by 40%"

EXAMPLES OF GOOD BULLET POINTS WITH DOMAIN CONTEXT:
- "Developed comprehensive user authentication system that improved security and reduced login issues by 40%"
- "Built medical imaging annotation platform for neuroscience research with advanced 3D visualization capabilities and machine learning integration"
- "Implemented automated trading system for financial markets that processed 10,000+ transactions daily with 99.9% accuracy"
- "Created e-commerce recommendation engine using machine learning algorithms that increased sales conversion by 25%"
- "Developed real-time data visualization dashboard for IoT sensor networks serving 50+ manufacturing facilities"

Return JSON:
{
  "bulletPoints": [
    {
      "text": "Resume bullet point text here",
      "actionVerb": "Primary action verb",
      "businessImpact": "Business value description",
      "confidence": 0.8
    }
  ],
  "isTrivial": false,
  "reasoning": "Brief explanation of the overall work accomplished"
}

Focus on the BIG PICTURE - what was the overall goal and impact of this work?`;
  }

  buildBulletPointPrompt(commit) {
    // Safely handle files - it might be missing or empty
    const files = commit.files || [];

    // Get file extensions to understand technologies
    const fileExtensions = [
      ...new Set(
        files
          .map((f) => {
            if (!f.filename) return null;
            const ext = f.filename.split(".").pop();
            return ext && ext.length < 5 ? ext : null;
          })
          .filter(Boolean)
      ),
    ];

    // Get main directories to understand project areas
    const directories = [
      ...new Set(
        files
          .map((f) => {
            if (!f.filename) return null;
            const parts = f.filename.split("/");
            return parts.length > 1 ? parts[0] : null;
          })
          .filter(Boolean)
      ),
    ].slice(0, 3);

    return `You are a professional resume writer. Convert this Git commit into professional resume bullet points emphasizing business impact.

REQUIREMENTS:
- Start with action verbs (Developed, Implemented, Built, Optimized, Created, etc.)
- Focus on BUSINESS IMPACT and RESULTS, not technical details
- Use quantifiable metrics when possible
- Keep language accessible to non-technical recruiters
- 1-2 lines maximum per bullet point
- Skip trivial changes

COMMIT:
Message: ${commit.message}
Files: ${files.length} files${
      fileExtensions.length > 0 ? ` (${fileExtensions.join(", ")})` : ""
    }
Changes: +${commit.stats?.additions || 0}/-${commit.stats?.deletions || 0} lines
${directories.length > 0 ? `Areas: ${directories.join(", ")}` : ""}

CODE CHANGES:
${files
  .slice(0, 5)
  .map((file) => {
    const patch = file.patch || "";
    return `${file.filename} (${file.status}):
${
  patch
    ? patch.substring(0, 200) + (patch.length > 200 ? "..." : "")
    : "No preview available"
}`;
  })
  .join("\n\n")}

EXAMPLES:
- "Developed user authentication system that improved security and reduced login issues by 40%"
- "Implemented automated testing framework that decreased bug reports by 60%"
- "Built responsive dashboard interface that increased user engagement by 35%"
- "Optimized database queries resulting in 50% faster page load times"

Return JSON:
{
  "bulletPoints": [
    {
      "text": "Resume bullet point text",
      "actionVerb": "Action verb",
      "businessImpact": "Business value description",
      "confidence": 0.8
    }
  ],
  "isTrivial": false,
  "reasoning": "Brief explanation"
}

If trivial, set isTrivial=true and empty bulletPoints array.`;
  }

  parseBulletPointResponse(responseText) {
    try {
      // Extract JSON from response (Claude sometimes adds explanation text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const result = JSON.parse(jsonMatch[0]);

      // Validate required fields
      if (
        !result.hasOwnProperty("bulletPoints") ||
        !result.hasOwnProperty("isTrivial")
      ) {
        throw new Error("Missing required bullet point fields");
      }

      // Validate bullet points structure
      if (!result.isTrivial && result.bulletPoints) {
        for (const bullet of result.bulletPoints) {
          if (!bullet.text || !bullet.actionVerb || !bullet.businessImpact) {
            throw new Error("Invalid bullet point structure");
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Failed to parse Claude response:", responseText);
      throw new Error("Invalid bullet point response format");
    }
  }
}

module.exports = ClaudeService;
