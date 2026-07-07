# AI-Powered Counterfeit Medicine Detection & Pharmaceutical Supply Chain Management System

An enterprise-grade, full-stack application designed to track pharmaceuticals, identify counterfeit drugs using Machine Learning (Isolation Forest & Random Forest), verify physical packaging using OpenCV & EasyOCR, and coordinate batch recalls with real-time logs.

---

## 🚀 Key Modules
1. **Module 1: User Authentication & Role Management (RBAC)**
   - Roles: `Manufacturer`, `Distributor`, `Pharmacy`, `Consumer`, and `Regulatory Authority`.
   - Security: JWT-based sessions, password hashing, activity log tracking, and regulatory approval queues for B2B nodes.
2. **Module 2: Medicine Batch Registration & Serialization**
   - Catalog creation, batch manufacturing limits, bulk CSV loading, and custom-generated serial QR tags.
3. **Module 3: Pharmaceutical Supply Chain Tracking**
   - Timeline nodes tracking custody transfers (Manufacturer → Distributor → Pharmacy), GPS updates, and ownership checks.
4. **Module 4: AI Counterfeit Detection Engine**
   - Outlier detection via **Isolation Forest** (detects duplicate scans, velocity anomalies).
   - Transaction risk score calculation via **Random Forest**.
5. **Module 5: OpenCV Package Authenticator**
   - Structural wrapper check (contours, tears), color validation (histogram correlation), and label OCR text reading via **EasyOCR**.
6. **Module 6: Public Consumer Portal**
   - Manual serialization lookups, scan history timelines, multi-language toggling, and instant counterfeit complaint forms.
7. **Module 7: National Recall Board & Monitoring Dashboard**
   - System KPIs, supplier rating risk indicators, PDF auditing exports, and automated recall broadcasting.

---

## 🛠️ Architecture & Folder Structure
- **`/backend`**: FastAPI application following modular MVC-like routing.
- **`/frontend`**: React + Vite SPA using Tailwind CSS, React Router, Recharts, and Axios.
- **`/docker-compose.yml`**: Full-stack orchestration (MongoDB + Python backend + Nginx frontend).

---

## 🖥️ Local Developer Setup

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **MongoDB** running locally on port `27017`

### Step 1: Start the Backend
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/macOS:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Pre-train ML models:
   ```bash
   python app/train_models.py
   ```
5. Seed the database with sandbox records:
   ```bash
   python seed.py
   ```
6. Start the API server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The Swagger UI documentation will be available at [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs).*

### Step 2: Start the Frontend
1. Navigate to `/frontend`:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will open at [http://localhost:5173](http://localhost:5173).*

---

## 🐳 Docker Deployment
To launch the entire suite (MongoDB + Backend + Frontend SPA) inside isolated containers:
1. Ensure Docker Desktop is running.
2. From the root directory:
   ```bash
   docker-compose up --build
   ```
3. Access:
   - **Frontend**: [http://localhost](http://localhost) (Port 80)
   - **Backend API Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

---

## 🧪 Running Tests
To run the automated backend test suites:
```bash
cd backend
pytest tests/
```

---

## 🔑 Pre-seeded Sandbox Logins
For quick testing and demonstrations, the seed script prepares the following accounts (all passwords are **`password123`**):

| Username | Role | Organization |
| :--- | :--- | :--- |
| **`regulator`** | Regulatory Authority | FDA Regulatory Authority |
| **`manufacturer`** | Manufacturer | PharmaCorp Factories Inc. |
| **`distributor`** | Distributor | LogisticsLink Solutions |
| **`pharmacy`** | Pharmacy | WellnessMeds Retail Pharmacy |
| **`consumer`** | Consumer | General Public Client |
| **`pending_mfg`** | Manufacturer (Awaiting Approval) | Standard Labs |
