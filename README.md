# BudgetBuddy: A Full-Stack Personal Budget Planning and Expense Management Platform

BudgetBuddy is a personal finance management web application designed for students and individuals to track daily expenses, manage monthly budgets, set savings goals, monitor income sources, and visualize spending habits through interactive dashboards and exportable reports.

---

## 🌟 Key Features

1. **User Authentication & Role-Based Access Control**
   - Secure JWT token authentication.
   - Mock OAuth2 single sign-on (Google & GitHub).
   - Roles: `Student`, `Premium User`, `Admin`.
2. **User Profile & Preferences**
   - Monthly income target setup, currency preferences, and notification alert thresholds.
3. **Expense Tracking System**
   - CRUD expenses across categories: `Food`, `Travel`, `Shopping`, `Education`, `Entertainment`, `Miscellaneous`.
   - Real-time search, category filtering, and date range filters.
4. **Income Management**
   - Track allowances, scholarships, freelance gigs, and part-time earnings.
5. **Budget Planning & Automated Alerts**
   - Category-wise monthly budget allocations.
   - Automated 80% warning alerts and 100%+ overspending notifications.
6. **Savings Goals & Milestone Tracking**
   - Visual milestone progress bars (e.g. "New Laptop Fund", "Japan Trip Fund", "Emergency Savings").
   - Deposit contribution modal and goal achievement notifications.
7. **Analytics Dashboard & Charts**
   - Interactive Recharts donut charts, monthly trend area charts, and financial health scores.
8. **Reports & Data Export**
   - Export records to **CSV**, multi-sheet **Excel (.xlsx)** workbooks, and print-ready **PDF** summary statements.
9. **Admin Panel**
   - Platform metrics, role elevation/demotion, user activation toggling, and audit log history.

---

## 🚀 Tech Stack

- **Backend**: FastAPI (Python 3.11), SQLAlchemy, Pydantic, PassLib, PyJWT, ReportLab, Pandas, OpenPyXL, Pytest.
- **Frontend**: React (Vite), Tailwind CSS, Lucide React Icons, Recharts, Axios, React Router v6.
- **Database**: SQLite (local development) / PostgreSQL 15 (Docker & production).
- **DevOps**: Docker, Docker Compose.

---

## 🛠️ Local Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🐳 Docker Setup

```bash
docker-compose up --build
```

---

## 🔑 Demo Login Credentials

- **Admin Account**: `admin@budgetbuddy.com` / `password123`
- **Student Account**: `student@budgetbuddy.com` / `password123`
- **Premium Account**: `premium@budgetbuddy.com` / `password123`

---

## 🧪 Running Backend Tests

```bash
cd backend
pytest
```
