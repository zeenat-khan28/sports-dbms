# RVCE SPORTS MANAGEMENT SYSTEM - SETUP GUIDE

This guide explains how to run the backend, frontend, and databases locally.

## Prerequisities
- **Python 3.10+** (for Backend)
- **Node.js 18+** (for Frontend)
- **PostgreSQL** (Running on localhost:5432)
- **MongoDB** (Running on localhost:27017 or Atlas URI)

---

## 1. Database Configuration

### PostgreSQL Setup
1. Open pgAdmin or PSQL terminal.
2. Create a database named `sports_db`.
3. The backend will automatically create tables on first run.

### Environment Variables
Ensure the `.env` file in the `backend/` folder is configured:
```env
DATABASE_URL=postgresql+asyncpg://postgres:yourpassword@localhost/sports_db
MONGO_URI=mongodb://localhost:27017
SECRET_KEY=your_secret_key
ADMIN_EMAIL=xxx@gmail.com
ADMIN_PASSWORD=xxxxxxxxxxxxxxxxxx
```

---

## 2. Running the Backend (FastAPI)

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create and activate a Virtual Environment (Optional but Recommended):
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Mac/Linux:
   source venv/bin/activate
   ```

3. Install Dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The API will be live at `http://localhost:8000`*
   *Swagger Docs available at `http://localhost:8000/docs`*

---

## 3. Running the Frontend (React + Vite)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install Dependencies:
   ```bash
   npm install
   ```

3. Start the Development Server:
   ```bash
   npm run dev
   ```
   *The UI will be accessible at `http://localhost:5173`*

---

## 4. How to Use the System

### Admin Access
- **URL**: `http://localhost:5173/login`
- **Email**: `xxx@gmail.com`
- **Password**: `xxxxxxxxxxxxxxxxxx`
- **Features**: Approve Students, Create Events, Manage Participants.

### Student Access
- **URL**: `http://localhost:5173/` or `http://localhost:5173/student/register`
- **Login**: Requires a Google Account ending in `@rvce.edu.in`.
- **Flow**:
    1. Login -> Fill Registration Form -> Wait for Approval.
    2. Once Approved -> Access Events Tab -> Request to Join Events.

---

## Troubleshooting

*   **Port Conflicts**: If the frontend says "Port 5173 in use", it will switch to 5174. Check the terminal output.
*   **Database Connections**: Ensure your local Postgres and Mongo services are running before starting the backend.
