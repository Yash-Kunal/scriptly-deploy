# Copilot Instructions for Scriptly (Collaborative Code Editor)

## Project Overview
- **Scriptly** is a full-stack collaborative code editor with chat and drawing board features.
- The project is split into two main folders:
  - `client/` — React + Vite frontend (TypeScript, TailwindCSS)
  - `server/` — Node.js backend (TypeScript, Express, Socket.IO, MongoDB)

## Architecture & Data Flow
- **Frontend** (`client/src/`):
  - Major features: code editor, chat, drawing board, user authentication, room management.
  - Uses React context for state: see `context/` for `AppContext`, `SocketContext`, etc.
  - Real-time collaboration via Socket.IO (see `hooks/`, `components/`, and `api/`).
  - Auth state is managed in `App.tsx` and passed via context/localStorage.
- **Backend** (`server/src/`):
  - `server.ts` is the main entry point, sets up Express, Socket.IO, and MongoDB connection.
  - REST endpoints for auth and room management in `routes/`.
  - User model in `models/User.ts` includes `rooms` array for joined rooms.
  - Socket.IO manages real-time code, chat, and drawing events.

## Developer Workflows
- **Frontend:**
  - Start: `cd client && npm run dev` (Vite dev server, proxy to backend)
  - Build: `npm run build`
  - Lint/format: see `.eslintrc.cjs` and `.prettierrc.json`
- **Backend:**
  - Start: `cd server && npm run dev` (nodemon + ts-node)
  - MongoDB must be running locally or as configured in `.env` (`MONGO_URI`)

## Key Patterns & Conventions
- **Authentication:**
  - JWT-based, handled via `/api/auth` endpoints (see `server/src/routes/auth.ts`).
  - User info and token stored in localStorage; logout clears both.
- **Room Management:**
  - User's joined rooms tracked in MongoDB (`rooms` array).
  - `/api/rooms/my-rooms` and `/api/rooms/add-room` endpoints for room list management.
- **Socket.IO:**
  - All real-time events (join, chat, code, drawing) handled in `server/src/server.ts` and corresponding frontend hooks/components.
  - Username uniqueness is enforced per room per socket session.
- **UI:**
  - TailwindCSS for styling; dark theme by default.
  - Username and logout button are fixed in the top-right corner for all pages.

## Integration Points
- **Frontend-backend communication:**
  - REST: `/api/auth/*`, `/api/rooms/*` (proxied via Vite dev server)
  - WebSocket: Socket.IO for all collaborative features
- **External dependencies:**
  - React, Vite, TailwindCSS, Socket.IO, Express, Mongoose, bcryptjs, jsonwebtoken

## Examples
- See `client/src/components/forms/FormComponent.tsx` for room join logic.
- See `server/src/server.ts` for Socket.IO event handling and user session logic.
- See `client/src/App.tsx` for authentication and logout flow.

---

If you add new features or change conventions, update this file to keep Copilot and other AI agents productive.
