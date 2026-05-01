# Automated Business Data Cleaning & Profit Dashboard

Upload a messy sales/expense spreadsheet and instantly get a clean profit
dashboard plus a downloadable Excel workbook and PDF report.

Built as a portfolio MVP to show how a small business or freelancer can turn
their bookkeeping export into actionable insights — no manual cleanup, no
formulas, no logins.

## Features

- **Drag-and-drop CSV / XLSX / XLS upload** with size and type validation.
- **One-click sample dataset** so anyone can demo the app without uploading.
- **Automatic cleaning** — header normalization, currency parsing, date
  parsing, duplicate removal, missing-category fill-in, income/expense
  classification.
- **Profit dashboard** — total sales, total expenses, net profit, profit
  margin, and transaction count.
- **Charts** — monthly trend (sales / expenses / profit) and a category
  breakdown donut.
- **Top products / services** ranked by revenue contribution.
- **Cleaned data preview** in a responsive table.
- **Data quality summary** — duplicates removed, empty rows dropped, invalid
  amounts skipped, missing categories filled.
- **Downloadable Excel & PDF reports** generated server-side.

## Tech stack

| Layer    | Tools                                                              |
| -------- | ------------------------------------------------------------------ |
| Frontend | React 19, Vite, Tailwind CSS v4, Recharts, Axios, lucide-react     |
| Backend  | FastAPI, Uvicorn, pandas, openpyxl, ReportLab                      |
| Reports  | Excel (`openpyxl`) + PDF (`reportlab`) generated on each analysis   |

## Project structure

```
business-expense-sales-dashboard/
├── backend/                FastAPI app, analysis pipeline, generated reports
│   ├── app/
│   │   ├── main.py         API entry: /health, /api/analyze, /api/download/*
│   │   ├── services/       cleaner, analyzer, categorizer, exporters
│   │   └── utils/          column mapping for messy headers
│   ├── generated/          per-request Excel + PDF files (created at runtime)
│   ├── requirements.txt
│   └── runtime.txt         pinned Python version (used by Render)
├── frontend/               React + Vite dashboard
│   ├── src/
│   │   ├── api/client.js   axios + base URL + sample CSV + error formatter
│   │   ├── components/     FileUpload, SummaryCards, charts, tables, …
│   │   ├── pages/Dashboard.jsx
│   │   └── index.css       Tailwind v4 entry
│   ├── .env.example
│   └── package.json
└── sample-data/            example messy spreadsheet for testing
```

## Local setup

### Prerequisites

- Python **3.11.x**
- Node **18+** (Node 20 LTS recommended)
- Windows PowerShell, macOS Terminal, or Linux shell

### 1. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1     # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API is now at <http://127.0.0.1:8000>. Quick check:

```powershell
curl http://127.0.0.1:8000/health
# → {"status":"ok"}
```

API endpoints:

| Method | Path                              | Purpose                              |
| ------ | --------------------------------- | ------------------------------------ |
| GET    | `/health`                         | Liveness check                       |
| POST   | `/api/analyze`                    | Multipart upload → analysis JSON     |
| GET    | `/api/download/excel/{file_id}`   | Download generated Excel report      |
| GET    | `/api/download/pdf/{file_id}`     | Download generated PDF report        |
| GET    | `/favicon.ico`                    | 204 no-content                       |

### 2. Frontend

```powershell
cd frontend
copy .env.example .env.local        # macOS/Linux: cp .env.example .env.local
npm install
npm run dev
```

Open <http://127.0.0.1:5173>.

### Environment variables

`frontend/.env.local`:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

In production, set this to your deployed backend URL (e.g.
`https://your-api.onrender.com`).

The backend reads an optional `FRONTEND_ORIGIN` env var to extend its CORS
allow-list (the local Vite port is allowed by default).

### Sample data

Two ways to try the app without your own file:

1. Click **"Try sample data"** in the upload panel — the UI sends a small
   built-in demo CSV to `/api/analyze`.
2. Upload `sample-data/messy-business-data.csv` from this repo.

## Deployment plan

### Backend → Render

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a new **Web Service** from the
   repo.
3. Settings:
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment**: Python (Render reads `runtime.txt` → `python-3.11.9`)
   - **Env var**: `FRONTEND_ORIGIN=https://your-frontend.vercel.app`

### Frontend → Vercel

1. On [Vercel](https://vercel.com), import the same GitHub repo.
2. Settings:
   - **Root directory**: `frontend`
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
   - **Env var**: `VITE_API_BASE_URL=https://your-backend.onrender.com`
3. Redeploy after the backend is live so the env var is baked into the build.

## Portfolio business use case

Small businesses and freelancers usually keep their books in a spreadsheet
that looks "good enough" but is hard to read at a glance:

- Currency mixed with text (`"$1,200"`, `"৳500"`, `"(1000)"`)
- Different column names every month (`Order Date` vs `Date` vs `Sale Date`)
- Missing categories
- Duplicate or empty rows

This app is the "instant clean + profit report" tool that converts that
messy export into a presentation-ready dashboard and a shareable PDF —
useful for monthly reviews, year-end summaries, or quick client reports.

## Future improvements

- Multi-currency support and per-currency totals.
- Save analyses to a lightweight SQLite store and let users compare months.
- Optional AI-assisted categorization (kept out of the MVP on purpose).
- More export formats (Google Sheets push, CSV-only download).
- Auth + per-user history (only if a real customer needs it).

## License

MIT — use it freely for portfolio, learning, or as a starting point.
