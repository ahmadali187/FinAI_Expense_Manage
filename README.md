# FinAI Expense Manager — Production Deployment & Operating Guide

## Overview & Architecture

**FinAI Expense Manager** is an enterprise-grade financial intelligence and expense management application built with a modern React frontend and a Python Flask REST API backend connected to a SQLite database.

### System Architecture
- **Frontend**: React 18, Chart.js, Lucide/FontAwesome icons, custom glassmorphism design system.
- **Backend API**: Flask REST API, Flask-SQLAlchemy, Flask-SocketIO (Real-time updates), Waitress WSGI (Production server).
- **Authoritative Database**: SQLite (`backend/finai.db`).
- **Financial Calculation Engine**: Centralized in `backend/services/financial_aggregation.py`.
- **AI Intelligence**: SQLite-grounded User FinAI Advisor & Admin Copilot Analyst.

---

## Environment Configuration

Copy or create a `.env` file in the project root:

```env
# Security & Secret Keys (REQUIRED in Production)
JWT_SECRET=your_secure_random_production_jwt_secret_key_here
FLASK_DEBUG=False
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Google OAuth Credentials (Optional)
GOOGLE_CLIENT_ID=your_production_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# AI Engine Configuration
GEMINI_API_KEY=your_gemini_api_key_if_applicable
```

> **Security Note**: Never commit `.env` files containing production secrets to source control.

---

## Prerequisites & Installation

### Requirements
- Node.js (v18.x or later)
- Python (v3.10 or later)
- npm or yarn

### 1. Backend Setup
```bash
# Navigate to backend directory or project root
pip install -r backend/requirements.txt
```

### 2. Frontend Setup
```bash
# Install frontend packages
npm install
```

---

## Running the Application

### Development Mode

#### Start Backend API
```bash
python backend/app.py
```
*Backend runs on `http://127.0.0.1:5000` with WebSocket support.*

#### Start Frontend Dev Server
```bash
npm start
```
*Frontend runs on `http://localhost:3000`.*

---

### Production Deployment

#### 1. Build React Static Assets
```bash
npm run build
```
Generates optimized static assets in the `build/` directory.

#### 2. Run Production WSGI Server
```bash
python backend/wsgi.py
```
Starts the production Waitress WSGI server on `http://127.0.0.1:5000`.

---

## Database Management & Backup / Restore

### Database Location
Authoritative SQLite database file: `backend/finai.db`

### Backup Procedure
Trigger automated atomic backups via Admin Panel or command line:
```python
python -c "from backend.app import app; from backend.backup_db import backup_database; backup_database()"
```
Backups are saved to `backups/finai_YYYY-MM-DD_HHMMSS.db`.

### Restore Procedure (Safely Tested)
1. Verify backup file integrity using SQLite:
   ```bash
   sqlite3 backups/finai_2026-08-13_142619.db "PRAGMA integrity_check;"
   ```
2. Stop the application server (`backend/app.py` or `backend/wsgi.py`).
3. Replace `backend/finai.db` with the target backup file.
4. Restart the server and verify health check endpoint `GET /api/admin/health`.

---

## Google OAuth Setup

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new OAuth 2.0 Client ID for a Web Application.
3. Add Authorized JavaScript origins: `http://localhost:3000` (or production domain).
4. Add Authorized redirect URIs: `http://localhost:3000/login`.
5. Set `GOOGLE_CLIENT_ID` in `.env`.

---

## Testing & Quality Assurance

### Run All Backend Automated Tests
```bash
python -m unittest discover -s backend/tests
```
Executes all **79 backend test suites** covering admin routes, authentication, financial aggregation, AI grounding, action safety, and production release acceptance.
