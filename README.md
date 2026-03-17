<<<<<<< HEAD
# 📦 Inventory Forecasting System
### AI-Powered Demand Forecasting for ERP Systems
**IGNOU MCA Final Year Project**

---

## 🏗️ Tech Stack
| Layer | Technology |
|-------|-----------|
| ML | Facebook Prophet |
| Backend | Python Flask |
| Frontend | React.js + Recharts |
| Database | Firebase Firestore |
| Auth | Firebase Authentication |
| Export | ReportLab (PDF), CSV |
| Demo | Streamlit |
| Backend Deploy | Render |
| Frontend Deploy | Vercel |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Firebase project (free tier)

---

### Step 1: Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in test mode)
5. Go to **Project Settings → Service Accounts** → Generate new private key
6. Save as `backend/firebase_credentials.json`
7. Go to **Project Settings → General** → Find your web app config

---

### Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Linux/Mac
venv\Scripts\activate          # Windows

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
# Edit .env — set FIREBASE_CREDENTIALS_PATH=firebase_credentials.json

# Run Flask
python app.py
# Backend runs on http://localhost:5000
```

---

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Edit .env — fill in your Firebase web config and API URL

# Start React app
npm start
# Frontend runs on http://localhost:3000
```

---

### Step 4: Upload Sample Data

1. Login at http://localhost:3000
2. Click **Upload Data**
3. Upload `database/sample_data/sample_inventory.csv`
4. Wait ~1-2 minutes for Prophet to train models
5. Explore forecasts, alerts, reports

---

### Streamlit Demo (Optional)

```bash
cd streamlit_app
pip install -r requirements.txt
streamlit run streamlit_app.py
```

---

## 🌐 Deployment

### Backend → Render

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, select `backend/` as root
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app`
6. Add environment variables:
   - `FIREBASE_CREDENTIALS_JSON` = (paste entire JSON as one line)
   - `FRONTEND_URL` = your Vercel URL
   - `FLASK_ENV` = production

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Select frontend folder as root
3. Add environment variables from `.env.example`
4. Set `REACT_APP_API_URL` = your Render backend URL + `/api`
5. Deploy

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Verify Firebase token |
| GET | `/api/me` | Get current user |
| POST | `/api/upload-data` | Upload CSV file |
| GET | `/api/forecast/<sku>` | Get SKU forecast |
| GET | `/api/forecast-all` | Get all forecasts |
| GET | `/api/alerts` | Get stockout alerts |
| GET | `/api/alerts/summary` | Alert count summary |
| POST | `/api/alerts/<id>/resolve` | Resolve alert |
| GET | `/api/products` | All products with risk |
| GET | `/api/dashboard-stats` | Dashboard overview |
| GET | `/api/reports/forecast/<sku>/csv` | Export CSV |
| GET | `/api/reports/forecast/<sku>/pdf` | Export PDF |
| GET | `/api/reports/forecast-all/csv` | All forecasts CSV |
| GET | `/api/reports/alerts/csv` | Alerts CSV |

---

## 📊 CSV Format

```csv
date,sku,sales,stock
2024-01-01,SKU001,45,500
2024-01-02,SKU001,52,455
2024-01-03,SKU002,120,1200
```

---

## 🔐 Role-Based Access

| Role | Permissions |
|------|------------|
| `viewer` | View forecasts, alerts, reports |
| `analyst` | + Upload data |
| `admin` | + Manage users, resolve alerts |

---

## 🧪 Testing

```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# API test with curl
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_FIREBASE_TOKEN"}'
```

---

## 📁 Project Structure

```
inventory-forecasting/
├── backend/           # Flask API + ML
├── frontend/          # React.js dashboard  
├── streamlit_app/     # Demo dashboard
├── database/          # Sample data + schema
└── docs/              # Academic documentation
```

---

## 👨‍🎓 Academic Info

- **Course**: MCA (Master of Computer Applications)
- **University**: IGNOU (Indira Gandhi National Open University)
- **Project Type**: Final Year Project
- **Subject Area**: Machine Learning, ERP Systems, Web Development
- **Devoped By**: Ayush Shankhwar
=======
# Inventory-Forecasting
Inventory Forecasting Using Machine Learning for ERP Systems
>>>>>>> e8ddc8913d5eacd491c78ceccd2e9484093b147a
