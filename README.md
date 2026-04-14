# TaskMatrix

**TaskMatrix** is a modern, modular, and performant project and task management application. Built with a Flask/MongoDB backend and a sleek, glassmorphism-inspired Tailwind CSS frontend, it provides teams with advanced role-based access control, deeply nested subtasks, and intelligent deadline tracking.

![TaskMatrix Dashboard Concept](https://img.shields.io/badge/UI-Glassmorphism-orange.svg) 
![Backend](https://img.shields.io/badge/Backend-Flask%20%7C%20PyMongo-blue.svg)

## Key Features

- **Granular Role-Based Access Control (RBAC):** Assign users as Admins, Viewers, or grant Custom Roles strictly bound to specific task subtrees for hyper-focused access mapping.
- **Intelligent Dashboard:** A centralized "My Tasks" section tracks tasks assigned to you across *all* projects, complete with smart scroll-and-flash highlight routing.
- **Dynamic Deadline Tracking:** Date indicators dynamically shift colors (Neutral → Amber (<= 5 days) → Rose (<= 3 days)) as deadlines approach to prioritize urgent work.
- **Nested Task Trees:** Create infinitely nestable subtasks. Progress bars automatically calculate completion parent-to-child.
- **Team Collaboration:** Invite users to projects, track members' completed tasks dynamically, and engage via task-specific Remarks/Comments.
- **Premium UI:** Powered by Tailwind CSS. Features deep Zinc dark mode, smooth micro-animations, glassmorphism panels, and a tailored Orange accent palette (`#f97316`).

## Technology Stack

**Frontend:**
- HTML5 / Vanilla JavaScript (Modular architecture)
- Tailwind CSS (via CDN)
- SVG iconography system

**Backend:**
- Python 3 / Flask
- MongoDB / PyMongo
- Flask-JWT-Extended (Authentication)

**Deployment Built-in:**
- Preconfigured `vercel.json` for seamless deployment on Vercel.

## Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask App Factory & DB Conn
│   │   ├── extensions.py        # Mongo collections
│   │   └── routes/              # Auth, Projects, Tasks
│   ├── requirements.txt
│   └── vercel_app.py            # Vercel Serverless Entry Point
├── frontend/
│   ├── index.html               # Main App Interface
│   └── js/                      
│       ├── setup.js             # Globals & State
│       ├── auth.js              # JWT handling
│       ├── projects.js          # Project & User Management
│       ├── tasks.js             # Task Tree rendering
│       ├── assigned_tasks.js    # Global 'My Tasks' logic
│       ├── modal.js             # Universal Modal behaviors
│       └── main.js              # Init calls
└── vercel.json                  # Remote hosting configuration
```

## Getting Started

### Prerequisites
- Python 3.9+
- MongoDB URI (Local or Atlas)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd taskmatrix
   ```

2. **Configure the Backend:**
   Navigate to the backend directory and set up the virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```
   Set up your environment variables (e.g., `MONGO_URI`, `JWT_SECRET_KEY`) dynamically or in `app/__init__.py`.

3. **Run the Backend:**
   ```bash
   python -m flask run --port=5000
   ```

4. **Launch the Frontend:**
   You can serve the frontend directory through any standard static server:
   ```bash
   # From the repository root
   python -m http.server 8000 --directory frontend
   ```
   Navigate to `http://localhost:8000` to interact with TaskMatrix.

## Contribution Requirements

Modifications to functionality should adhere to the existing decoupled, global-scope Vanilla JS architecture mapped in `frontend/js/`. Ensure that newly added endpoints natively check RBAC and JWT configurations defined in `backend/app/routes/`.

## License

This project is unlicensed.
