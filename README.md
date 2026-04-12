# Personal AI Assistant

Personal AI Assistant is a full-stack learning and support platform with user auth, AI chat, quizzes, admin tools, notifications, contact workflows, and profile management.

## Stack

- Frontend: React, Vite, Chakra UI, Redux Toolkit
- Backend: Node.js, Express, MongoDB, JWT, Nodemailer, Cloudinary
- AI and APIs: Groq, YouTube Data API

## Local development

### Frontend

```bash
cd client
npm install
npm run dev
```

### Backend

```bash
cd server
npm install
npm run start
```

Frontend runs on `http://localhost:5173` by default.
Backend runs on `http://127.0.0.1:8000` by default.

## Environment setup

Use these starter files:

- [client/.env.example](/Users/surajkumar/Downloads/personnel%20training%20assistent%20copy/client/.env.example)
- [server/.env.example](/Users/surajkumar/Downloads/personnel%20training%20assistent%20copy/server/.env.example)

## Deployment

This repo is now prepared for common hosting setups.

### Frontend options

1. Vercel
   - Root directory: `client`
   - Build command: `npm run build`
   - Output directory: `dist`
   - Set `VITE_API_BASE_URL` to your deployed backend URL
   - SPA rewrite file included: [client/vercel.json](/Users/surajkumar/Downloads/personnel%20training%20assistent%20copy/client/vercel.json)

2. Netlify
   - Root directory: `client`
   - Build command: `npm run build`
   - Publish directory: `dist`
   - SPA redirects included: [netlify.toml](/Users/surajkumar/Downloads/personnel%20training%20assistent%20copy/netlify.toml)

### Backend options

1. Render
   - Blueprint included: [render.yaml](/Users/surajkumar/Downloads/personnel%20training%20assistent%20copy/render.yaml)
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm run start`

2. Railway / similar Node hosts
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm run start`
   - Add the same environment variables listed in [server/.env.example](/Users/surajkumar/Downloads/personnel%20training%20assistent%20copy/server/.env.example)

## Production checklist

1. Set `VITE_API_BASE_URL` in the frontend deployment
2. Set `FRONTEND_URL` and optionally `FRONTEND_URLS` in the backend deployment
3. Keep `ALLOW_ALL_ORIGINS=false` unless you deliberately want open CORS
4. Add all database, AI, email, and Cloudinary secrets in the backend host
5. Make sure MongoDB Atlas allows the backend host IPs
6. Rotate any secrets that were previously shared in chat

## Health check

After deployment, verify:

- `GET /api/v1/health`
- frontend login
- OTP email delivery
- admin panel access
- chat response
- contact reply notifications

## Note

I prepared the project for deployment, but I did not publish it to a public host because that needs access to your hosting account.
