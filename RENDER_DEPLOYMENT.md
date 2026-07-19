# Render Deployment Guide

## Quick Start

1. Go to https://render.com and sign up (free)
2. Click **"New +"** → **"Web Service"**
3. Select **"Connect a repository"** and choose `the-ice-cream-man`
4. Render will auto-detect `render.yaml`
5. Click **"Deploy"**

## Environment Variables

After deployment, add these environment variables in Render dashboard:

### Required Variables

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `JWT_SECRET` | [Your JWT Secret] | User authentication secret |
| `DATABASE_URL` | [Your Database URL] | PostgreSQL connection string |
| `VITE_APP_ID` | [Your App ID] | Application identifier |
| `OAUTH_SERVER_URL` | [Your OAuth URL] | OAuth server endpoint |
| `OWNER_OPEN_ID` | [Your Owner ID] | Owner identifier |
| `BUILT_IN_FORGE_API_URL` | [Your Forge API URL] | Internal API endpoint |
| `BUILT_IN_FORGE_API_KEY` | [Your Forge API Key] | Internal API key |

## Getting Your Values

These values are stored in your Manus project secrets. Contact your admin or check your project configuration.

## After Deployment

Once Render shows "Live", your backend API will be available at:
```
https://ice-cream-man-api.onrender.com
```

Update your mobile app to use this URL for API calls.

## Troubleshooting

- **Build fails**: Check that `npm install` and `npm start` work locally
- **App crashes**: Check Render logs for error messages
- **Environment variables not set**: Add them in Render dashboard under "Environment"
