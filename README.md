# OBIA ChatBot — IOAI Bolivia 2026 Selection Contest

An educational AI assistant platform for the Bolivia IOAI 2026 Selection Contest. Students can ask isolated, stateless questions about AI, machine learning, Python, mathematics, and statistics during the competition.

**The entire student experience is localized in Spanish.**

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Next.js     │────▶│  FastAPI      │────▶│ PostgreSQL │
│  Frontend    │◀────│  Backend      │◀────│            │
│  :3000       │     │  :8001        │     │  :5433     │
└─────────────┘     └──────┬───────┘     └────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  OpenAI API  │
                    │  gpt-4o-mini │
                    └──────────────┘
```

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Next.js 14, TypeScript, TailwindCSS |
| Backend        | FastAPI, SQLAlchemy, Pydantic       |
| Database       | PostgreSQL 16                       |
| Auth           | JWT + bcrypt                        |
| AI             | OpenAI gpt-4o-mini                  |
| Infrastructure | Docker, Docker Compose              |

## Quick Start

### 1. Clone and configure

```bash
git clone <repo-url>
cd OBIA-ChatBot

# Create backend env file
cp .env.example backend/.env
```

Edit `backend/.env` and set your **OpenAI API key** and a strong **JWT secret**.

### 2. Prepare the Student List

The system seeds users from a CSV file. Create `backend/students.csv` with the following format:
```csv
FirstName,LastName,username,password
Juan,Perez,jperez,secret123
Maria,Garcia,mgarcia,topsecret
```

### 3. Launch with Docker Compose

```bash
docker compose up --build
```

This will:
- Start PostgreSQL
- Build and start the FastAPI backend
- **Auto-seed** the admin account and all students from `students.csv`.
- Build and start the Next.js frontend

### 4. Access the platform

| Service   | URL                         |
|-----------|-----------------------------|
| Frontend  | http://localhost:3000        |
| Backend   | http://localhost:8001        |
| API Docs  | http://localhost:8001/docs   |

## Default Credentials

### Admin

| Username | Password (from .env) |
|----------|----------------------|
| admin    | *ADMIN_PASSWORD*     |

### Students
Credentials are defined in `backend/students.csv`.

## Features

### For Students (All in Spanish)
- **Chat Principal**: Interface minimalista y rápida para consultas.
- **Historial de Consultas**: Pantalla dedicada para revisar preguntas y respuestas previas con formato Markdown.
- **Indicador de Uso**: Visualización en tiempo real de consultas restantes.
- **Soporte Bilingüe**: La IA responde en el idioma que el estudiante use (Español o Inglés).

### For Admins
- **User Management**: Add new students manually or edit their request limits.
- **Usage Dashboard**: Monitor real-time usage across all participants.
- **Interaction Logs**: Browse full history of all prompts and AI responses.
- **Security Control**: Enable or disable accounts instantly.

### Security & Integrity
- **JWT Authentication**: Secure stateless sessions.
- **Request Limits**: Hard caps on requests and tokens to ensure contest fairness.
- **System Prompt**: Optimized to prevent the AI from giving direct solutions to contest problems.

## Environment Variables

| Variable                | Default                                          | Description                 |
|-------------------------|--------------------------------------------------|-----------------------------|
| `DATABASE_URL`          | `postgresql://obia:obia_secret@db:5432/obia_chatbot` | PostgreSQL connection    |
| `JWT_SECRET`            | *(required)*                                     | JWT signing secret          |
| `OPENAI_API_KEY`        | *(required)*                                     | OpenAI API key              |
| `ADMIN_PASSWORD`        | *(required)*                                     | Password for admin account  |
| `MAX_INPUT_TOKENS`      | `2000`                                           | Max input tokens per request|
| `MAX_OUTPUT_TOKENS`     | `1200`                                           | Max output tokens per request|
| `DEFAULT_MAX_REQUESTS`  | `120`                                            | Default limit for students  |

## Project Structure

```
OBIA-ChatBot/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI entry point
│   │   ├── models.py          # SQLAlchemy models (User, Log)
│   │   ├── schemas.py         # Pydantic schemas
│   │   ├── routers/           # Auth, Assistant, Admin routers
│   │   └── services/          # OpenAI & Token services
│   ├── seed.py                # CSV-based seeder
│   └── students.csv           # Student source data
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx           # Login (Spanish)
│   │   ├── assistant/         # Chat UI (Spanish)
│   │   ├── history/           # History UI (Spanish)
│   │   └── admin/             # Admin Dashboard (English)
│   └── lib/api.ts             # API Client
├── docker-compose.yml
└── README.md
```

## Development

### Running locally (without Docker)

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Setup .env and students.csv
   python seed.py
   uvicorn app.main:app --port 8001
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Set NEXT_PUBLIC_API_URL=http://localhost:8001 in .env.local
   npm run dev
   ```

## License

Internal use — Bolivia IOAI Selection Contest 2026.
