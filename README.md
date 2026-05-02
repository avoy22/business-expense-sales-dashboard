# Automated Business Data Cleaning & Profit Dashboard

Upload a messy sales/expense spreadsheet and instantly get a clean profit
dashboard plus a downloadable Excel workbook and PDF report.

Built as a portfolio MVP to show how a small business or freelancer can turn
their bookkeeping export into actionable insights — no manual cleanup, no
formulas, no logins.

## Live Demo

Frontend: https://business-expense-sales-dashboard.vercel.app  
Backend Health Check: https://business-expense-sales-dashboard.onrender.com/health

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

## Screenshots

Screenshots of the dashboard live in [`screenshots/`](screenshots/). Drop your
own captures there (e.g. `dashboard.png`, `upload.png`) and embed them above
the **Features** section once you have them.

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
├── sample-data/            example messy spreadsheets for testing
│   ├── messy-business-data.csv
│   ├── ecommerce-sample.csv
│   └── freelancer-income-expense.csv
└── screenshots/            put dashboard screenshots here for the README
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

Three ready-made CSVs live in [`sample-data/`](sample-data/):

| File                                    | Use case                                       |
| --------------------------------------- | ---------------------------------------------- |
| `messy-business-data.csv`               | Tiny demo with mixed currency formatting       |
| `ecommerce-sample.csv`                  | E-commerce store: orders, ad spend, shipping   |
| `freelancer-income-expense.csv`         | Freelancer: client invoices, software, office  |

You have three ways to try the app without your own file:

1. Click **"Try sample data"** in the upload panel — the UI ships a small
   built-in demo CSV to `/api/analyze`.
2. Upload one of the files in `sample-data/` from the upload panel.
3. POST a sample file directly to the API:
   ```powershell
   curl.exe -F "file=@sample-data/ecommerce-sample.csv" http://127.0.0.1:8000/api/analyze
   ```

## Test checklist

Run through this list before shipping a build or recording a portfolio demo.

**Backend smoke tests** (with the API running on port 8000):

- [ ] `GET /health` returns `{"status":"ok"}`.
- [ ] `POST /api/analyze` with `sample-data/messy-business-data.csv` returns
      a JSON body that includes `summary`, `monthly_trend`,
      `category_breakdown`, `top_products`, `preview_rows`, `data_quality`,
      `download_excel_url`, and `download_pdf_url`.
- [ ] `GET /api/download/excel/{file_id}` downloads a valid `.xlsx` file.
- [ ] `GET /api/download/pdf/{file_id}` downloads a valid `.pdf` file.
- [ ] `GET /api/download/excel/does-not-exist` returns a clean 404.
- [ ] Uploading a `.txt` file returns a 400 with a friendly message.
- [ ] Uploading an empty file returns a 400 with a friendly message.

**Frontend smoke tests** (with both servers running):

- [ ] Hero, "How it works", and the upload card all render on first load.
- [ ] Clicking **Try sample data** populates the dashboard end-to-end:
      summary cards, monthly trend chart, category donut, top products,
      data quality card, and cleaned data preview.
- [ ] Uploading `sample-data/ecommerce-sample.csv` shows duplicate rows
      removed in the data quality card.
- [ ] Uploading `sample-data/freelancer-income-expense.csv` shows missing
      categories filled in the data quality card.
- [ ] **Download Cleaned Excel** and **Download PDF Report** are disabled
      before any analysis runs and become real download links after.
- [ ] Stopping the backend and clicking **Try sample data** shows a friendly
      "Cannot reach the backend" error card; restarting the backend lets a
      retry succeed.
- [ ] `npm run build` finishes without errors.

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

Kept deliberately out of the MVP — only worth adding when a real user needs
them:

- **Multi-currency support** — detect currency per row and report totals per
  currency.
- **Persistent history** — a tiny SQLite store so a user can compare months
  or re-open a previous analysis without re-uploading.
- **CSV download** of the cleaned dataset (in addition to Excel + PDF).
- **Date range filter** on the dashboard for users with large files.
- **AI-assisted categorization** as an opt-in upgrade for messy descriptions
  the keyword categorizer can't classify.
- **Auth + per-user history** — only if there's a real customer asking.

## License

MIT — use it freely for portfolio, learning, or as a starting point.
