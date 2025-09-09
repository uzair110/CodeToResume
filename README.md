# Commit Resume Generator

Transform your Git commit history into professional resume bullet points.

## Features

- 🔐 Secure GitHub authentication
- 📊 Repository selection and analysis
- 🎯 Intelligent commit analysis
- 📝 Professional bullet point generation
- ✨ Clean, modern UI

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development servers:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

### GitHub Token Setup

1. Go to [GitHub Settings > Personal Access Tokens](https://github.com/settings/tokens/new)
2. Create a new token with `repo` scope
3. Use the token to authenticate in the application

## Project Structure

```
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Express.js backend
├── .env.example     # Environment variables template
└── package.json     # Root package.json for scripts
```

## Development

- Frontend: React + Vite + Tailwind CSS
- Backend: Express.js + Session-based auth
- API: RESTful endpoints with GitHub integration

## Security

- Encrypted token storage
- Secure session management
- No permanent code storage
- Input validation and sanitization