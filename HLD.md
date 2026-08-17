# High-Level Design (HLD)
## Orbit — Creator-Brand Collaboration Platform

---

## 1. System Overview

Orbit is a two-sided marketplace web application. It follows a classic client-server architecture with a React single-page application (SPA) on the frontend and a RESTful Node.js/Express API on the backend, backed by a MongoDB database.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                     │
│                React SPA (Vite + Tailwind CSS)              │
│         Creator UI  ◄──────────────►  Brand UI             │
└─────────────────────────┬───────────────────────────────────┘
                          │  HTTPS / REST (JSON)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  API SERVER (AWS EC2)                        │
│              Node.js + Express.js (Port 5001)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  /auth   │  │ /creator │  │  /brand  │  │/connection│  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │  Mongoose ODM
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│    users │ creatorprofiles │ brandprofiles │ connections    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Style

- **Frontend**: Single-Page Application (SPA) — React Router handles all client-side navigation; the server only serves one `index.html`.
- **Backend**: Monolithic RESTful API — all modules (auth, creator, brand, connections) reside in a single Express server process.
- **Database**: Document-oriented (MongoDB) — flexible schema suited for heterogeneous profile structures.
- **Auth**: Stateless JWT authentication — no server-side sessions; the token is stored in `localStorage` and sent with every API request via the `Authorization` header.

---

## 3. High-Level Components

### 3.1 Frontend (React SPA)

| Layer | Responsibility |
|-------|---------------|
| **Pages** | Full-screen views rendered per route (Landing, Login, Signup, Onboarding, Dashboard, Browse, Profile, Requests, Settings) |
| **Layouts** | Persistent shell (sidebar + header) wrapping protected routes; one layout per role (`CreatorLayout`, `BrandLayout`) |
| **Components** | Reusable UI pieces — sidebar, nav items, shadcn/ui primitives |
| **ProtectedRoutes** | Auth guard; decodes JWT client-side to enforce role-based route access |
| **Axios calls** | Direct API calls from page components; no global state manager (e.g., Redux) |

### 3.2 Backend (Express API)

| Layer | Responsibility |
|-------|---------------|
| **Routes** | Map HTTP method + path to controller functions; apply `authMiddleware` where needed |
| **Controllers** | Business logic — validate input, query the database, format and return responses |
| **Middleware** | `authMiddleware` — verifies JWT and attaches decoded `{ userId, role }` to `req.user` |
| **Models** | Mongoose schemas defining document structure and types for each collection |
| **Config** | `db.js` — establishes MongoDB connection using `MONGO_URI` from `.env` |

### 3.3 Database (MongoDB)

| Collection | Purpose |
|-----------|---------|
| `users` | Core identity — email, hashed password, role, onboarding status |
| `creatorprofiles` | Extended creator data — metrics, social links, niche, bio |
| `brandprofiles` | Extended brand data — company info, campaign preferences, contact |
| `connections` | Relationship graph — sender/receiver IDs, status, optional message |

---

## 4. Data Flow

### 4.1 Signup & Login

```
Browser                     API Server                  MongoDB
  │                              │                          │
  │── POST /api/auth/signup ────►│                          │
  │                              │── Insert User ──────────►│
  │                              │── Insert empty Profile ─►│
  │◄── 201 Created ─────────────│                          │
  │                              │                          │
  │── POST /api/auth/login ─────►│                          │
  │                              │── Find User by email ───►│
  │                              │◄── User document ────────│
  │                              │  (bcrypt compare)        │
  │◄── 200 { token, role, ──────│                          │
  │         onBoardingCompleted} │                          │
```

### 4.2 Protected API Request

```
Browser                  authMiddleware              Controller
  │                           │                          │
  │── GET /api/creator/all ──►│                          │
  │   Authorization: <token>  │                          │
  │                           │  jwt.verify(token)       │
  │                           │  req.user = {userId,role}│
  │                           │─────────────────────────►│
  │                           │                 DB query │
  │◄────────────────────────────────── 200 Response ─────│
```

### 4.3 Connection Request

```
Sender (Brand/Creator)      API Server              MongoDB
  │                              │                     │
  │── POST /api/connections/ ───►│                     │
  │      send { receiverId }     │── Check existing ──►│
  │                              │◄── null ────────────│
  │                              │── Create Connection ►│
  │◄── 201 { connection } ──────│                     │
  │                              │                     │
Receiver                         │                     │
  │── PUT /api/connections/:id ─►│                     │
  │      { status: "accepted" }  │── Update status ───►│
  │◄── 200 { connection } ──────│                     │
```

---

## 5. Authentication & Authorization

- **Token generation**: JWT signed with `JWT_SECRET` (from `.env`), payload: `{ userId, role }`, expiry: 7 days.
- **Token transport**: Stored in browser `localStorage`; sent in the `Authorization` header (with or without "Bearer " prefix — middleware handles both).
- **Server-side verification**: `authMiddleware` verifies the token on every protected route and attaches the decoded user context to `req.user`.
- **Client-side enforcement**: `ProtectedRoutes` component decodes the JWT payload client-side (base64) and redirects if the role doesn't match the requested route prefix (`/creator/*` vs `/brand/*`).

---

## 6. Module Breakdown

```
orbit-backend/
├── server.js              ← App entry point; mounts routes
├── config/db.js           ← MongoDB connection
├── middleware/
│   └── authMiddleware.js  ← JWT verification
├── models/
│   ├── User.js
│   ├── CreatorProfile.js
│   ├── BrandProfile.js
│   └── Connection.js
├── controllers/
│   ├── authController.js
│   ├── creatorController.js
│   ├── brandController.js
│   └── connectionController.js
└── routes/
    ├── authRoutes.js
    ├── creatorRoutes.js
    ├── brandRoutes.js
    └── connectionRoutes.js

orbit-frontend/src/
├── App.jsx                ← Route tree
├── layouts/               ← Role-specific app shells
├── pages/                 ← One file per screen
│   ├── onboardingpages/
│   ├── dashboard/
│   ├── profilePages/
│   └── settings/
└── components/
    ├── ui/                ← shadcn/ui primitives (~55 components)
    ├── landing/           ← Marketing page sections
    └── app-sidebar.jsx    ← Role-aware navigation sidebar
```

---

## 7. Deployment Architecture

```
┌──────────────────────────────────────────┐
│             User's Browser               │
│          React SPA (static files)        │
└──────────────────┬───────────────────────┘
                   │ HTTPS
                   ▼
┌──────────────────────────────────────────┐
│            AWS EC2 Instance              │
│   Node.js + Express API  (Port 5001)     │
│   Environment: .env (MONGO_URI,          │
│   JWT_SECRET, PORT)                      │
└──────────────────┬───────────────────────┘
                   │ Mongoose ODM
                   ▼
┌──────────────────────────────────────────┐
│              MongoDB                     │
│  (Atlas cloud or self-hosted on EC2)     │
└──────────────────────────────────────────┘
```

- The backend API is hosted on an AWS EC2 instance and is accessed directly via IP (`13.239.47.56:5001`).
- The frontend is a Vite-built static bundle served separately (e.g., via a CDN, Netlify, or the same EC2 instance).
- CORS is enabled globally on the Express server to allow frontend-to-API requests.

---

## 8. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `User` and profile documents | Keeps core auth data lean; profile data can evolve independently |
| Profile created at signup (not first onboarding step) | Ensures a profile document always exists for `findOneAndUpdate` in onboarding controllers |
| Stateless JWT auth | Simple to implement, scales horizontally without session stores |
| Two role-specific layouts | Clean separation of creator and brand UX without conditional rendering throughout |
| Shared `Requests.jsx` page | Connection data is symmetric enough that one component handles both roles |
| No Mongoose `.populate()` in connection controller | Manual loops give finer control over which profile type to fetch based on dynamic role data |
