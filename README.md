# ChoiceCLASH — 2D Online Multiplayer Chess

A full-stack 2D real-time multiplayer chess application built with React, Vite, Tailwind CSS, `chess.js`, `react-chessboard`, Node.js, Express, Socket.io, Prisma, and SQLite/PostgreSQL.

## Admin Account

- **Email**: `admin@choiceclash.com`
- **Default Password**: `Admin123!` (configurable via `ADMIN_PASSWORD` in `server/.env`)
- **Dashboard**: `/admin` (manage users, ban/unban, edit W/L/D stats, toggle roles, close live rooms, and delete game records)

## Prerequisites

- Node.js 20+
- PostgreSQL 15+

## Quick Start

### 1. Server Setup

```bash
cd server
npm install
cp .env.example .env
# Update DATABASE_URL and JWT_SECRET in .env
npx prisma migrate dev --name init
npm run dev
```

### 2. Client Setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` in your browser.
