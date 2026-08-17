# Low-Level Design (LLD)
## Orbit — Creator-Brand Collaboration Platform

---

## 1. Database Schema

### 1.1 Collection: `users`

```
Field                 Type       Constraints
─────────────────────────────────────────────────────
_id                   ObjectId   Auto-generated primary key
name                  String     Required
email                 String     Required, unique index
password              String     Required (bcrypt hash, 10 salt rounds)
role                  String     Required, enum: ["creator", "brand"]
onBoardingCompleted   Boolean    Default: false
```

No timestamps on this collection (by design — createdAt/updatedAt are on profile documents instead).

---

### 1.2 Collection: `creatorprofiles`

```
Field                 Type       Constraints / Notes
──────────────────────────────────────────────────────────────
_id                   ObjectId   Auto-generated
userId                ObjectId   Required, ref: "User"
currentStep           Number     Default: 1 (tracks onboarding progress, 1–4)
fullName              String
username              String
location              String
niche                 [String]   e.g. ["Tech", "Gaming"]
bio                   String
instagramUsername     String
youtubeUrl            String
linkedInUrl           String
portfolioUrl          String
instagramFollowers    Number
youtubeSubscribers    Number
averageViews          Number
audienceCountry       String
createdAt             Date       Auto (timestamps: true)
updatedAt             Date       Auto (timestamps: true)
```

---

### 1.3 Collection: `brandprofiles`

```
Field                 Type       Constraints / Notes
──────────────────────────────────────────────────────────────
_id                   ObjectId   Auto-generated
userId                ObjectId   Required, ref: "User"
currentStep           Number     Default: 1
companyName           String
industry              String
companySize           String
website               String
location              String
description           String
targetAudience        String
marketingGoals        String
preferredNiche        [String]   e.g. ["Fashion", "Beauty"]
instagramPage         String
linkedInPage          String
contactEmail          String
contactPerson         String
budgetRange           String     e.g. "₹50k–₹2L"
preferredPlatform     String     e.g. "Instagram"
campaignFrequency     String     e.g. "Monthly"
targetCountry         String
createdAt             Date       Auto (timestamps: true)
updatedAt             Date       Auto (timestamps: true)
```

---

### 1.4 Collection: `connections`

```
Field                 Type       Constraints / Notes
──────────────────────────────────────────────────────────────
_id                   ObjectId   Auto-generated
senderId              ObjectId   Required, ref: "User"
receiverId            ObjectId   Required, ref: "User"
senderRole            String     enum: ["creator", "brand"]
status                String     enum: ["pending", "accepted", "declined"], default: "pending"
message               String     Default: "" (optional collaboration message)
createdAt             Date       Auto (timestamps: true)
updatedAt             Date       Auto (timestamps: true)
```

---

## 2. API Endpoints — Detailed Specification

### 2.1 Auth Routes (`/api/auth`)

#### POST `/api/auth/signup`
- **Auth**: None
- **Body**: `{ name, email, password, confirmPass, role }`
- **Validations**:
  - All fields required
  - `email` matches regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - `password.length >= 8`
  - `password === confirmPass`
  - No existing user with same email
- **On success**:
  1. Hash password: `bcrypt.hash(password, 10)`
  2. Insert into `users`
  3. Insert empty profile into `creatorprofiles` or `brandprofiles` with `{ userId, currentStep: 1 }`
  4. Return `201 { success: true, message: "Account created successfully" }`
- **Errors**: `400` for validation failures, `500` for server errors

#### POST `/api/auth/login`
- **Auth**: None
- **Body**: `{ email, password }`
- **Validations**: Both fields required; user must exist; `bcrypt.compare` must pass
- **On success**:
  1. Sign JWT: `jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "7d" })`
  2. Return `200 { message, token, role, onBoardingCompleted }`
- **Errors**: `400` invalid credentials, `404` user not found, `500` server error

---

### 2.2 Creator Routes (`/api/creator`) — all require `authMiddleware`

#### POST `/api/creator/onboarding`
- **Body**: Full creator profile fields (all onboarding form data)
- **Action**: `findOneAndUpdate({ userId }, { ...body }, { new: true })` on `creatorprofiles`; sets `User.onBoardingCompleted = true`
- **Response**: `200 { message, creator }`

#### PUT `/api/creator/save-step`
- **Body**: Partial profile fields + `currentStep: Number`
- **Action**: `findOneAndUpdate({ userId }, { ...body })` — persists partial progress mid-onboarding
- **Response**: `200 { message, creator }`

#### GET `/api/creator/profile`
- **Action**: Find `creatorprofiles` by `userId`; find `users` by `_id` for `onBoardingCompleted`
- **Response**: `200 { creator, onBoardingCompleted }`

#### GET `/api/creator/all`
- **Query params**: `?search=<string>` (text match on fullName, username, location), `?niche=<string>` (match in niche array)
- **Action**: Build dynamic Mongoose filter; query `creatorprofiles`
- **Response**: `200 { creators: [...] }`

#### GET `/api/creator/:id`
- **Param**: `:id` = `creatorprofiles._id`
- **Action**: `CreatorProfile.findById(id)`
- **Response**: `200 { creator }`

---

### 2.3 Brand Routes (`/api/brand`) — all require `authMiddleware`

#### POST `/api/brand/onboarding`
- **Body**: Full brand profile fields
- **Action**: `findOneAndUpdate({ userId }, { ...body }, { new: true })` on `brandprofiles`; sets `User.onBoardingCompleted = true`
- **Response**: `200 { message, brand }`

#### PUT `/api/brand/save-step`
- **Body**: Partial brand fields + `currentStep: Number`
- **Action**: `findOneAndUpdate({ userId }, { ...body })`
- **Response**: `200 { message, brand }`

#### GET `/api/brand/profile`
- **Action**: Find `brandprofiles` by `userId`; look up `onBoardingCompleted` from `users`
- **Response**: `200 { brand, onBoardingCompleted }`

#### GET `/api/brand/all`
- **Query params**: `?search=<string>` (match on companyName, industry, location), `?niche=<string>` (match in preferredNiche), `?industry=<string>`
- **Action**: Build dynamic Mongoose filter; query `brandprofiles`
- **Response**: `200 { brands: [...] }`

#### GET `/api/brand/:id`
- **Param**: `:id` = `brandprofiles._id`
- **Action**: `BrandProfile.findById(id)`
- **Response**: `200 { brand }`

---

### 2.4 Connection Routes (`/api/connections`) — all require `authMiddleware`

#### POST `/api/connections/send`
- **Body**: `{ receiverId, message? }`
- **Validations**:
  - `receiverId` required
  - No existing connection `{ senderId, receiverId }`
  - No reverse connection `{ senderId: receiverId, receiverId: senderId }`
- **Action**: `Connection.create({ senderId, receiverId, senderRole, message })`
- **Response**: `201 { message, connection }`

#### GET `/api/connections/received`
- **Action**:
  1. `Connection.find({ receiverId: userId }).sort({ createdAt: -1 })`
  2. For each result, look up sender's profile (CreatorProfile or BrandProfile based on `senderRole`)
  3. Build enriched array with `senderName`, `senderLocation`, `senderNiche`
- **Response**: `200 { requests: [...] }`

#### GET `/api/connections/sent`
- **Action**:
  1. `Connection.find({ senderId: userId }).sort({ createdAt: -1 })`
  2. For each result, look up `User.findById(receiverId)` to determine role, then look up receiver's profile
  3. Build enriched array with `receiverName`, `receiverLocation`, `receiverRole`
- **Response**: `200 { requests: [...] }`

#### GET `/api/connections/count`
- **Action**: `Connection.countDocuments({ receiverId: userId, status: "pending" })`
- **Response**: `200 { count: Number }`

#### GET `/api/connections/check/:targetId`
- **Param**: `:targetId` = target's `User._id`
- **Action**: `Connection.findOne({ $or: [{ senderId: userId, receiverId: targetId }, { senderId: targetId, receiverId: userId }] })`
- **Response**: `200 { exists: Boolean, status?, connectionId?, isSender? }`

#### PUT `/api/connections/:id`
- **Param**: `:id` = `Connection._id`
- **Body**: `{ status }` — must be `"accepted"` or `"declined"`
- **Validation**: `connection.receiverId === req.user.userId` (only receiver can update)
- **Action**: `connection.status = status; connection.save()`
- **Response**: `200 { message, connection }`

---

## 3. Middleware

### 3.1 `authMiddleware`

```
Input:  req.header("Authorization")  →  raw token string (with or without "Bearer " prefix)
        
Logic:
  1. If no token → 401 "No token provided"
  2. Strip "Bearer " prefix if present
  3. jwt.verify(token, process.env.JWT_SECRET)
  4. Attach decoded payload to req.user = { userId, role }
  5. Call next()
  
On error: 401 "Invalid token"
```

---

## 4. Frontend Component Details

### 4.1 Route Structure (`App.jsx`)

```
/                         → LandingPage           (public)
/login                    → LoginForm             (public)
/signup                   → SignupForm            (public)
/creator-onboarding       → CreatorOnBoard        (ProtectedRoutes)
/brand-onboarding         → BrandOnBoard          (ProtectedRoutes)

/creator/*                → ProtectedRoutes → CreatorLayout
  /creator/dashboard      → CreatorDashboard
  /creator/profile        → CreatorProfile
  /creator/settings       → CreatorSettings
  /creator/browse         → BrowseBrands
  /creator/brand/:id      → BrandDetail
  /creator/requests       → Requests

/brand/*                  → ProtectedRoutes → BrandLayout
  /brand/dashboard        → BrandDashboard
  /brand/profile          → BrandProfile
  /brand/settings         → BrandSettings
  /brand/browse           → BrowseCreators
  /brand/creator/:id      → CreatorDetail
  /brand/requests         → Requests
```

---

### 4.2 `ProtectedRoutes` Logic

```
1. Read token from localStorage
2. If no token → <Navigate to="/login" />
3. Decode JWT payload: JSON.parse(atob(token.split(".")[1]))
4. Extract role from payload
5. If pathname starts with "/creator" AND role !== "creator" → redirect to "/brand/dashboard"
6. If pathname starts with "/brand" AND role !== "brand"    → redirect to "/creator/dashboard"
7. If decode fails → localStorage.removeItem("token") → redirect to "/login"
8. Otherwise → render children
```

---

### 4.3 `AppSidebar` Pending Badge Logic

```
On mount:
  fetchCount() → GET /api/connections/count → setPendingCount(res.data.count)
  
setInterval(fetchCount, 30000)   ← refresh every 30 seconds
clearInterval on unmount

Nav item mapping:
  navItems = config.navMain.map(item =>
    item.title === "Requests" && pendingCount > 0
      ? { ...item, badge: pendingCount }
      : item
  )
```

---

### 4.4 Onboarding Wizard (`CreatorOnBoard` / `BrandOnBoard`)

```
State:
  step      : Number (1–4)
  formData  : Object (all profile fields)
  loading   : Boolean
  error     : String

On mount (useEffect):
  GET /api/creator/profile
  → if onBoardingCompleted → navigate("/creator/dashboard")
  → else populate formData from existing profile
        set step = creator.currentStep if > 1

nextStep():
  1. Validate current step fields (e.g., step 1 requires fullName)
  2. PUT /api/creator/save-step  { ...formData, currentStep: step + 1 }
  3. setStep(step + 1)

handleSubmit():
  POST /api/creator/onboarding  { ...formData }
  → navigate("/creator/dashboard")
```

---

### 4.5 Connection Flow (Detail Pages)

```
On mount:
  GET /api/connections/check/:targetUserId
  → { exists, status, isSender }
  → set connectionState

Connect button states:
  exists === false              → "Connect" button (active)
  exists === true, status === "pending", isSender === true   → "Request Sent" (disabled)
  exists === true, status === "pending", isSender === false  → "Respond" (shows accept/decline)
  exists === true, status === "accepted"                     → "Connected" (disabled)
  exists === true, status === "declined"                     → "Declined" (disabled)

On "Connect" click:
  POST /api/connections/send  { receiverId, message }
  → refresh connection state
```

---

## 5. Environment Variables

### Backend (`.env`)

```
PORT=5001
MONGO_URI=<MongoDB connection string>
JWT_SECRET=<secret key for signing JWTs>
```

### Frontend
Currently no `.env` file — the API base URL (`http://13.239.47.56:5001`) is hardcoded in each API call.
Recommended improvement: use `VITE_API_URL` in `.env` and reference via `import.meta.env.VITE_API_URL`.

---

## 6. Error Handling Conventions

| HTTP Status | Meaning |
|-------------|---------|
| 200 | Success (GET, PUT) |
| 201 | Resource created (POST) |
| 400 | Bad request / validation error |
| 401 | Unauthenticated (missing or invalid token) |
| 403 | Forbidden (authenticated but not authorized — e.g., non-receiver trying to update connection) |
| 404 | Resource not found |
| 500 | Unexpected server error |

All error responses follow the shape: `{ message: "Human-readable description" }`

---

## 7. Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19 |
| Frontend build tool | Vite | 6 |
| Frontend routing | React Router DOM | 7 |
| HTTP client | Axios | latest |
| UI components | shadcn/ui (Radix UI) | latest |
| Styling | Tailwind CSS | 4 |
| Icons | Lucide React | latest |
| Toasts | Sonner | latest |
| Backend runtime | Node.js | LTS |
| Backend framework | Express | 5 |
| ODM | Mongoose | 9 |
| Auth | jsonwebtoken + bcryptjs | latest |
| Database | MongoDB | Atlas/EC2 |
