# Vercel Deployment Guide

## Prerequisites
1. Vercel account (sign up at vercel.com)
2. OpenAI API key (get from https://platform.openai.com/api-keys)
3. Git repository with your code

## Deployment Steps

### 1. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project root
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: figma-voice-commands (or your choice)
# - Directory: ./
# - Override settings? No
```

### 2. Set Environment Variables
In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add: `OPENAI_API_KEY` = `your_actual_api_key`
3. Add: `NEXT_PUBLIC_API_URL` = `https://your-app-name.vercel.app`

### 3. Update Plugin Configuration
After deployment, update the API URL in your plugin:

1. Get your Vercel URL (e.g., `https://figma-voice-commands.vercel.app`)
2. Update `src/config.js`:
```javascript
export const API_BASE_URL = isProduction 
  ? 'https://your-actual-vercel-url.vercel.app'
  : 'http://localhost:3000';
```

### 4. Test the Deployment
1. Open your Vercel URL in browser
2. Test voice interface
3. Test Figma plugin with new URL

## Local Development
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your API key

# Start local server
npm run server

# Build plugin
npm run build
```

## File Structure
```
├── api/
│   └── index.js          # Vercel serverless API
├── src/
│   ├── plugin/           # Figma plugin files
│   ├── frontend/         # Voice interface
│   └── config.js         # Environment config
├── vercel.json           # Vercel configuration
└── package.json
```

## Troubleshooting

### Common Issues:
1. **CORS errors**: Check that your Vercel URL is correct
2. **API key not found**: Verify environment variables in Vercel dashboard
3. **Plugin not loading**: Check that manifest.json has correct permissions

### Debug Steps:
1. Check Vercel function logs
2. Test API endpoints directly
3. Verify environment variables
4. Check browser console for errors
