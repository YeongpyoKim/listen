Serverless comments API

This directory contains a simple serverless function that stores/retrieves
comments in the repository file (default: `site/data/comments.json`) using
the GitHub REST API.

Deployment options
- Vercel: drop the `api` folder into a Vercel project root and set env vars.
- Netlify Functions: adapt `api/comments.js` as a Netlify handler (already compatible with Express-like request/response).

Required environment variables
- `GITHUB_TOKEN` — personal access token with `repo` scope
- `GITHUB_REPO` — owner/repo (e.g., `YeongpyoKim/listen`)
- `GITHUB_BRANCH` — optional (default `main`)
- `GITHUB_FILE` — optional (default `site/data/comments.json`)

Endpoints
- GET `/api/comments` — returns the full comments object (JSON)
- POST `/api/comments` — body JSON `{ id: 's01', name: '이름', text: '댓글 내용' }` — appends a comment and commits to the repo

Security note
Do NOT embed the token in client-side code. Use serverless env vars or a secure backend.
