# ResolveDesk — Hosting & Deployment Guide

This guide provides step-by-step instructions for hosting the **ResolveDesk** full-stack application (React 19 + Vite frontend, Node.js + Express + Socket.IO backend, and MongoDB database).

---

## Architecture Summary for Hosting

| Service | Recommended Provider | Build / Runtime | Environment Variables Required |
| :--- | :--- | :--- | :--- |
| **Database** | MongoDB Atlas (Free M0) | Managed MongoDB | N/A |
| **Backend API Server** | Render / Railway | Node.js (`npm start`) | `PORT`, `MONGO_URI`, `JWT_SECRET`, `NODE_ENV` |
| **Frontend Web App** | Vercel / Netlify / Render | Static Build (`npm run build`) | `VITE_API_BASE_URL` |

---

## Option 1: Free Cloud Hosting (MongoDB Atlas + Render + Vercel)

### Step 1: Database Setup (MongoDB Atlas)
1. Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Shared M0 (Free)** Cluster.
3. Under **Database Access**, create a database user (e.g. `resolvedesk_admin`) and password.
4. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Drivers** -> Copy your connection string:
   ```env
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/resolvedesk?retryWrites=true&w=majority
   ```

---

### Step 2: Backend Hosting (Render.com)
1. Push your repository to GitHub or GitLab.
2. Sign up at [Render.com](https://render.com).
3. Click **New +** -> **Web Service** and connect your repository.
4. Configure the Web Service settings:
   - **Name:** `resolvedesk-backend`
   - **Root Directory:** `server`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add **Environment Variables** under the Environment tab:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `generate_a_secure_secret_key_here`
6. Click **Create Web Service**. Once deployed, Render will provide your backend URL (e.g., `https://resolvedesk-backend.onrender.com`).

---

### Step 3: Frontend Hosting (Vercel)
1. Sign up at [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project** and import your GitHub repository.
3. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://resolvedesk-backend.onrender.com/api`
5. Click **Deploy**. Vercel will build your React application and give you your frontend URL (e.g., `https://resolvedesk.vercel.app`).

---

## Option 2: Single VPS / Docker Hosting (DigitalOcean / AWS / Linode)

If hosting on a Linux server (Ubuntu 22.04 LTS), you can run both frontend and backend using Docker or PM2 + Nginx.

### Using PM2 & Nginx

#### 1. Server Setup & PM2 Backend Launch
```bash
# Connect to your server
ssh root@your-server-ip

# Install Node.js, MongoDB & Nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb nginx

# Install PM2 globally
sudo npm install -g pm2

# Clone repository and install dependencies
git clone https://github.com/your-username/resolvedesk.git
cd resolvedesk/server
npm install

# Start backend using PM2
pm2 start src/index.js --name "resolvedesk-api"
pm2 save
pm2 startup
```

#### 2. Build Frontend
```bash
cd ../client
npm install
npm run build
```

#### 3. Nginx Reverse Proxy & Static Hosting (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Serve React Static Frontend
    location / {
        root /path/to/resolvedesk/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy API requests to Node Backend
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Reverse Proxy Socket.IO WebSockets
    location /socket.io/ {
        proxy_pass http://localhost:5000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

```bash
# Test & Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

---

## Verification & Health Check

After deployment, test the backend health endpoint:
```bash
curl https://your-backend-domain.com/api/health
```
**Expected Response:**
```json
{
  "status": "ok",
  "message": "ResolveDesk API is healthy",
  "timestamp": "2026-07-28T14:52:00.000Z"
}
```
