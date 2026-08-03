# ResolveDesk — Campus Complaint Management System

ResolveDesk is a complaint management system for a college. Students report campus issues (electrical, plumbing, IT, facility, etc.), technicians resolve them, department heads assign and oversee work, and admins manage the system end to end.

---

## 🛠 Project Structure

```
.
├── client/          # Frontend: React 19 + Vite + TailwindCSS
├── server/          # Backend API: Node.js + Express + Mongoose + Socket.IO
├── AGENTS.md        # Source of truth for tech stack, enums, & rules
└── README.md        # Root setup documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ recommended
- **npm**: v9+ recommended
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection string
- **Cloudinary**: Cloudinary account for complaint image uploads

---

### Environment Setup

1. **Server Configuration**:
   ```bash
   cp server/.env.example server/.env
   ```
   Configure environment parameters in `server/.env`:
   - `PORT`: Backend server port (default: `5000`)
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT signing
   - `CLOUDINARY_CLOUD_NAME`: `smart-complaints`
   - `CLOUDINARY_API_KEY`: `565856528721262`
   - `CLOUDINARY_API_SECRET`: `14llw_uwCGVPwJsSqfoJKqfBiZM`

2. **Client Configuration**:
   ```bash
   cp client/.env.example client/.env
   ```
   Configure environment parameters in `client/.env`:
   - `VITE_API_BASE_URL`: Base URL for API calls (default: `http://localhost:5000/api`)

---

## ☁️ Image Upload Architecture (Cloudinary)

Complaint attachments (e.g. photos uploaded by students when raising an issue) are uploaded to Cloudinary:

- **Storage Engine**: `multer` handles `multipart/form-data` image buffers in memory.
- **Upload Utility**: `uploadToCloudinary` pipes image buffers to Cloudinary under the `resolvedesk/complaints` folder.
- **URL Storage**: Secure HTTPS image URLs returned by Cloudinary are stored in the Mongoose `images` array on the Complaint document.

---

## 📡 Key API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student or staff account
- `POST /api/auth/login` — Login & receive JWT token
- `POST /api/auth/forgot-password` — Generate 6-digit OTP
- `POST /api/auth/reset-password` — Reset password using OTP
- `GET /api/auth/me` — Fetch authenticated user profile

### Complaints (`/api/complaints`)
- `POST /api/complaints` — Create a new complaint (Protected, supports `images` multipart uploads)
  - **Body**: `title`, `description`, `category`, `location`, `priority` (`Critical` | `High` | `Medium` | `Low`), `department`
  - **Files**: `images` (up to 5 image files)

---

### Installation

From the root directory, install dependencies for both `client` and `server`:

```bash
# Install root dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

---

### Running Development Servers

#### Option 1: Run Both Concurrently from Root
```bash
npm run dev
```

#### Option 2: Run Separately
- **Backend API Server**:
  ```bash
  npm run dev:server
  # or: cd server && npm run dev
  ```
  API Server runs at `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)

- **Frontend Client App**:
  ```bash
  npm run dev:client
  # or: cd client && npm run dev
  ```
  Vite App runs at `http://localhost:3000`

---

## 🔍 Code Quality & Formatting

```bash
# Run ESLint for both client & server
npm run lint

# Format code with Prettier
npm run format
```

---

## 🚀 Hosting & Production Deployment

For complete hosting instructions on **Render + Vercel + MongoDB Atlas** or single **Linux VPS / Nginx**, see the dedicated deployment guide:
👉 [DEPLOYMENT.md](file:///d:/smart%20campus%20complaint/DEPLOYMENT.md)

