# CAMPUX Frontend

Minimalist Stealth React + Tailwind CSS client for CAMPUX, inspired by Finora's dark monochrome aesthetic.

## Tech Stack
- **Framework:** React 19 + Vite 8
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM v7
- **HTTP Client:** Axios with JWT Interceptors & Auth Cookie support
- **Icons:** Lucide React

## Backend Routes Mapped
- `POST /api/v1/users/register` -> Register user account
- `POST /api/v1/users/login` -> Authenticate user with accessToken / refreshToken
- `GET /api/v1/users/getProfile` -> Fetch authenticated user details (protected)
- `PATCH /api/v1/users/update` -> Update user profile (name, username, email, branch, year, password)
- `POST /api/v1/users/logout` -> Logout and invalidate session
- `POST /api/v1/users/refresh-token` -> Silent refresh of expired access tokens

## Quick Start

```bash
# Navigate to the frontend directory
cd frontend

# Run development server
npm run dev

# Build for production
npm run build
```

Development server runs on `http://localhost:5173` with automated API and Socket.IO proxies to the backend on `http://localhost:3000`.
