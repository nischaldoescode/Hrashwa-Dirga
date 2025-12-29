# Hrashwa-Dirga Backend API

Production-ready Node.js backend for the Hrashwa-Dirga game application.

## Tech Stack

- Node.js + Express
- MongoDB + Mongoose
- Firebase Admin SDK
- Cloudinary (Image Storage)
- JWT Authentication
- HTTP-only Cookies

## Prerequisites

- Node.js 16+ installed
- MongoDB running (local or Atlas)
- Firebase project created
- Cloudinary account created

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create `.env` file in backend root with all required variables (see `.env` file)

3. Get Firebase credentials:
- Go to Firebase Console
- Project Settings > Service Accounts
- Generate New Private Key
- Copy values to .env

4. Get Cloudinary credentials:
- Sign up at cloudinary.com
- Dashboard shows Cloud Name, API Key, API Secret
- Copy to .env

## Running the Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Routes

### Authentication (User)
- POST /api/auth/google-signin
- GET /api/auth/profile
- POST /api/auth/logout
- POST /api/auth/refresh-coins
- GET /api/auth/check

### Admin
- POST /api/admin/login
- POST /api/admin/logout
- GET /api/admin/dashboard-stats
- GET /api/admin/users
- PATCH /api/admin/users/:userId/toggle-status
- DELETE /api/admin/users/:userId
- GET /api/admin/check-auth

### Questions
- POST /api/questions (Admin)
- PUT /api/questions/:id (Admin)
- DELETE /api/questions/:id (Admin)
- GET /api/questions/all (Admin)
- GET /api/questions/:id (Admin)
- GET /api/questions/level/:levelId (User)
- POST /api/questions/submit-answer (User)
- POST /api/questions/use-hint (User)
- GET /api/questions/level/:levelId/next (User)

### Levels
- POST /api/levels (Admin)
- PUT /api/levels/:id (Admin)
- DELETE /api/levels/:id (Admin)
- GET /api/levels/all (Admin)
- GET /api/levels/published (User)
- GET /api/levels/:id (Admin)
- GET /api/levels/:id/questions (User)
- POST /api/levels/:levelId/complete (User)

### Leaderboard
- GET /api/leaderboard (User)
- GET /api/leaderboard/my-rank (User)
- GET /api/leaderboard/top-users (User)

### Config
- GET /api/config (User)
- PUT /api/config (Admin)
- POST /api/config/logo (Admin)
- DELETE /api/config/logo (Admin)
- PATCH /api/config/app-name (Admin)

## Security Features

- HTTP-only cookies for authentication
- JWT token validation
- Rate limiting
- Helmet security headers
- CORS protection
- Input validation
- Secure password handling

## Caching

In-memory caching implemented for:
- App configuration (10 min)
- Leaderboard data (1 min)
- Level data (5 min)

## Error Handling

All errors are caught and returned in consistent format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Admin Credentials

Default admin login:
- Email: admin@hrashwadirga.com
- Password: Admin@12345

Change these in .env file before deployment.

## Database Models

- User: User accounts and progress
- Level: Game levels
- Question: Questions with 3 options
- AppConfig: Global app settings

## Deployment

1. Set NODE_ENV=production in .env
2. Use MongoDB Atlas for database
3. Deploy to services like Heroku, Railway, or DigitalOcean
4. Ensure HTTPS is enabled
5. Set secure CORS origins

## Support

For issues, check logs and ensure all environment variables are configured correctly.