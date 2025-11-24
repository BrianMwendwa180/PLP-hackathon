# Task: Fix Vercel Frontend to Use Render Backend URL Instead of Localhost

## Steps from Approved Plan

### 1. Update API Configuration Files
- [x] Update client/src/lib/api.ts: Replace hardcoded localhost URL with Vite environment variable (VITE_API_BASE_URL) fallback.
- [ ] Update client/src/lib/enhancedApi.ts: Replace hardcoded localhost URL with Vite environment variable (VITE_API_BASE_URL) fallback.
- [ ] (Optional) Create client/.env.example to document the environment variable for reference.

### 2. Deployment and Testing
- [ ] Commit and push changes to trigger Vercel redeploy.
- [ ] In Vercel dashboard: Add environment variable VITE_API_BASE_URL = https://terralink-jodf.onrender.com/api.
- [ ] Test the deployed Vercel site: Verify API calls in browser network tab use the Render URL.
- [ ] If issues, check for other localhost references (e.g., WebSocket in SocketContext.tsx) and update accordingly.

## Progress Notes
- Step 1a (api.ts update) completed successfully.
