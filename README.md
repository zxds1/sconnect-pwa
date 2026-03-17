<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1795b079-8993-4fc6-a5b4-88a75b375e8a

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Create `.env.local` (or copy `PWA/.env.example`) and set `VITE_API_BASE_URL` plus any optional auth fields.
3. Run the app: `npm run dev`

## Netlify Deployment
1. Connect the repository in Netlify and select the `PWA` directory as the base.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Set environment variables in Netlify: `VITE_API_BASE_URL` (required), `VITE_TENANT_ID` (optional), `VITE_USER_ID` (optional), `VITE_AUTH_TOKEN` (optional), `VITE_ROLE` (optional).

The Netlify configuration file is already provided at `PWA/netlify.toml`.
