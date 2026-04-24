# JobPath

JobPath is a Skill-Based AI Career Path Generator. It allows users to register, log in, define a professional career goal, and track their current skillset with proficiencies.

**Note:** The Machine Learning models for actual path generation will be injected by the developer into the placeholder UI elements seamlessly.

## Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the Application:**
```bash
python app.py
```

The database (`jobpath.db`) will be automatically initialized when the app runs for the first time.

## Architecture

- **Backend Dashboard & APIs:** Flask, Flask-SQLAlchemy, Flask-Login. Data stored locally via SQLite.
- **Frontend App:** Server-side rendered HTML using Jinja2 with extensive interactive client-side fetching for Dashboard components.
- **Styling:** Bootstrap 5 alongside a highly customized visual token map for a clean UI feeling.
- **Charts:** Radars created directly via Chart.js hooked into Flask endpoints fetching active user data.
