# ProConnect — AI-Powered Professional Platform

A full-stack professional networking platform with AI-powered profile assistance and smart content recommendations. Built with **React**, **FastAPI**, **SQLite**, and **OpenAI API**.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green) ![Python](https://img.shields.io/badge/Python-3.10+-yellow) ![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)

---

## Features

### Exercise 1: Foundation App
- **User Signup/Login** — Email & password auth with JWT tokens and password strength validation (uppercase, lowercase, number, symbol)
- **Profile Management** — Name, email, company, role, bio, industry, experience level, pronouns, and avatar
- **AI Chat Assistant** — OpenAI-powered assistant that can answer any general question (like ChatGPT) while also guiding users through profile completion with automatic profile updates via function calling
- **Chat History** — All conversations are saved and persist across sessions, with the ability to clear history
- **Profile Completion Tracking** — Visual progress bar showing field-by-field completion status
- **Avatar Editor** — Canvas-based image editor with drag-to-pan, zoom, and crop functionality
- **Company Autocomplete** — Clearbit-powered company search with logo display during signup and profile editing
- **Theme System** — Light, Dark, and System theme modes with localStorage persistence

### Exercise 2: Intelligence Layer
- **Content Database** — 25 curated seed articles/resources across multiple categories with tags
- **Live Article Fetching** — Supplements seed data with fresh articles from the Dev.to API (cached for 24 hours)
- **Smart Recommendations** — Rule-based engine that suggests up to 5 articles based on user role, industry, and experience level
- **Tag Matching** — Articles are scored by matching profile attributes to content tags
- **Personalized Reasoning** — Each recommendation set includes an explanation of why articles were chosen

---

## Architecture

```
project-root/
├── backend/                  # Python FastAPI server
│   ├── app/
│   │   ├── main.py           # Application entry point & lifespan
│   │   ├── config.py         # Settings & environment variables
│   │   ├── database.py       # SQLAlchemy engine & session
│   │   ├── models.py         # Database models (User, ChatMessage, Article, Tag)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── seed_data.py      # 25 sample articles with tags
│   │   ├── routers/
│   │   │   ├── auth.py       # POST /api/auth/signup, /api/auth/login
│   │   │   ├── users.py      # GET/PATCH /api/users/me
│   │   │   ├── chat.py       # POST /api/chat, GET/DELETE /api/chat/history
│   │   │   └── recommendations.py  # GET /api/recommendations
│   │   └── services/
│   │       ├── auth.py              # JWT token & password hashing
│   │       ├── ai_assistant.py      # OpenAI integration + fallback
│   │       ├── recommendations.py   # Tag-based recommendation engine
│   │       └── article_fetcher.py   # Dev.to API article fetching & caching
│   ├── start.bat             # One-click backend launcher (Windows)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React (Vite) client
│   ├── src/
│   │   ├── App.jsx           # Router & auth guards
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Global auth state
│   │   │   └── ThemeContext.jsx  # Light/Dark/System theme provider
│   │   ├── services/api.js   # Axios API client
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx      # Signup & login
│   │   │   └── DashboardPage.jsx # Main dashboard with tabs
│   │   └── components/
│   │       ├── ProfileCard.jsx       # Profile summary & progress
│   │       ├── ProfileForm.jsx       # Edit profile fields
│   │       ├── ChatWidget.jsx        # AI assistant chat
│   │       ├── Recommendations.jsx   # Article recommendations
│   │       ├── AvatarEditor.jsx      # Canvas-based avatar crop & zoom
│   │       └── SettingsDropdown.jsx  # Theme switcher dropdown
│   └── package.json
└── README.md
```

---

## Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **OpenAI API Key** (optional — app works with fallback assistant if not provided)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your OpenAI API key (optional)
# The app works WITHOUT an API key using a rule-based fallback assistant
```

**Start the server:**

```bash
# Quick start (Windows) — activates venv and runs the server in one step:
.\start.bat

# Or manually:
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signup` | Create new account | No |
| POST | `/api/auth/login` | Sign in | No |
| GET | `/api/users/me` | Get current user profile | Yes |
| PATCH | `/api/users/me` | Update profile fields | Yes |
| POST | `/api/chat` | Send message to AI assistant | Yes |
| GET | `/api/chat/history` | Get chat conversation history | Yes |
| DELETE | `/api/chat/history` | Clear chat conversation history | Yes |
| GET | `/api/recommendations` | Get personalized article recommendations | Yes |
| GET | `/api/health` | Health check | No |

---

## AI Integration

The chat assistant uses **OpenAI GPT-4o-mini** with **function calling** to:
1. Answer any general question — weather, history, science, coding, math, advice, and more
2. Analyze which profile fields are missing
3. Conversationally guide users to complete their profile
4. Automatically extract and update profile fields from the conversation via an `update_user_profile` tool
5. Provide context-aware suggestions based on current profile state

**Fallback Mode**: If no OpenAI API key is configured, the assistant uses a rule-based system that still guides users through profile completion step by step, parsing answers and updating fields automatically.

---

## Recommendation Engine

The recommendation system uses a **rule-based tag matching** approach with live content enrichment:

1. **Profile Analysis** — Extracts keywords from user's role, industry, and experience level
2. **Tag Mapping** — Maps profile attributes to content tags (e.g., "engineer" → ["engineering", "technology", "coding"])
3. **Live Fetching** — Supplements 25 seed articles with fresh content from the **Dev.to API**, cached in the database for 24 hours
4. **Scoring** — Each article is scored by counting matching tags and category overlap
5. **Ranking** — Top 5 articles by score are returned with reasoning

---

## Design Decisions

- **FastAPI** over Flask/Django for async support, automatic OpenAPI docs, and Pydantic validation
- **SQLite** for zero-config database setup (easily switchable to PostgreSQL)
- **JWT Bearer tokens** for stateless authentication
- **OpenAI GPT-4o-mini** with function calling for cost-effective, fast AI responses that can update profile fields directly
- **Rule-based recommendations** for predictable, explainable results (vs. opaque ML models)
- **Dev.to API integration** for live article fetching with a 24-hour database cache layer
- **Theme system** (Light/Dark/System) with localStorage persistence for user preference
- **Canvas-based avatar editor** for in-browser image cropping and resizing
- **Clearbit API** for company autocomplete with logo display
- **Fallback AI mode** so the app works even without an API key

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for chat assistant | `""` (fallback mode) |
| `SECRET_KEY` | JWT signing secret | `dev-secret-key...` |
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./app.db` |

---

## License

Built as a technical exercise for AI Monster.
