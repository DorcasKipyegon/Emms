# EMMS.PRO (Equipment Maintenance Management System)

A modern, full-stack web application designed to streamline facility maintenance, manage equipment lifecycles, and coordinate technician workflows.

![EMMS.PRO Dashboard Concept](https://via.placeholder.com/1000x500.png?text=EMMS.PRO+Dashboard) *(Replace with actual screenshot)*

## 🚀 Key Features Built So Far

### 1. Role-Based Unified Workflows
- Tailored experiences for **Managers** (full administrative control, analytics, reporting, scheduling) and **Technicians** (assigned task execution, equipment status updates).
- **Unified Equipment Details:** A single adaptive interface that provides read-only tracking for Technicians, but dynamically unlocks administrative actions (Edit, Schedule, Upload) for Managers.

### 2. Comprehensive Equipment Management
- Maintain detailed records of all facility equipment, their operational status, specifications, and maintenance history.
- **QR Code Integration:** Managers can generate and print QR codes for machines. Technicians can scan them for instant access to equipment details and logging.
- **Document Vault:** Securely upload, view, and manage equipment manuals, schematics, and warranty documents directly from the equipment profile.

### 3. Maintenance & Work Order Flow
- **Task Management Board:** Clean, filterable Kanban-style board to track tasks (`Pending`, `In Progress`, `Completed`, `Archived`). Includes one-click CSV exporting for reporting.
- **Maintenance Requests:** Workers can submit maintenance requests that managers can review, approve into work orders, or reject.
- **Automated Preventive Maintenance (PM):** Managers can configure time-based (e.g., every 30 days) or usage-based (e.g., every 500 hours) PM schedules. The system automatically generates work orders using Celery.

### 4. Smart Inventory & Parts Tracking
- Track spare parts, monitor current stock against reorder levels, and automatically generate unique SKUs based on part names.
- **Parts Usage Log:** Detailed historical tracking of every spare part used, identifying the work order, technician, quantity, and cost at the time of usage.

### 5. Automated Technician Onboarding
- Managers can invite technicians via an intuitive UI. The system automatically provisions accounts and securely emails setup links without exposing passwords or relying on Django admin.

## 🛠️ Tech Stack

**Frontend**
- React 19
- Vite
- Tailwind CSS (with beautiful teal accents & glassmorphism)
- React Router DOM
- Axios (API Communication)

**Backend**
- Python / Django 5+
- Django REST Framework (DRF)
- PostgreSQL (Production) / SQLite (Local Development)
- SimpleJWT (Token-based Authentication)
- Celery & Redis (Asynchronous background tasks & Email sending)

---

## ⚙️ Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites
Make sure you have the following installed:
- Node.js (v18+)
- Python (v3.10+)
- Redis (for Celery background tasks)

### 1. Clone the Repository
```bash
git clone https://github.com/DorcasKipyegon/Emms.git
cd Emms
```

### 2. Backend Setup
Navigate to the backend directory and set up your Python environment:
```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend/` directory and add your configurations (refer to your email/DB settings):
```env
SECRET_KEY=your_secret_key_here
DEBUG=True
DB_NAME=emms_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
```

**Run Migrations & Start Server:**
```bash
python manage.py migrate
python manage.py runserver
```

*(Optional) Start Celery worker & beat in new terminals for background tasks:*
```bash
celery -A emms_backend worker -l info --pool=solo
celery -A emms_backend beat -l info
```

### 3. Frontend Setup
Open a new terminal window, navigate to the frontend directory, and install the Node modules:
```bash
cd frontend
npm install

# Start the Vite development server
npm run dev
```

### 4. Access the Application
- **Frontend UI:** Open your browser to `http://localhost:5173`
- **Backend API:** `http://localhost:8000/api/`

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/DorcasKipyegon/Emms/issues).

## 📄 License
This project is licensed under the MIT License.
