# Sub-Hub

Track all your fixed subscriptions (Netflix, HBO Max, Spotify, ...) in one place and see your total monthly spend. Add them by hand or detect them automatically from a linked bank account (via Plaid).

## Stack
- **Client:** React + Vite (`client/`)
- **Server:** Express + MongoDB (Mongoose), JWT auth, Plaid (`server/`)

## Setup
1. Copy `server/.env.example` to `server/.env` and fill in your values (MongoDB URI, JWT secret, Plaid sandbox keys).
2. Install and run the server:
   ```
   cd server
   npm install
   npm run dev
   ```
3. Install and run the client (proxies `/api` to port 5000):
   ```
   cd client
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

## Features
- Sign up / log in
- Add, edit, pause, and delete subscriptions (weekly, monthly, yearly)
- Monthly and yearly totals, spend by category, upcoming renewals
- Detect subscriptions from your bank with Plaid
- Light and dark mode
