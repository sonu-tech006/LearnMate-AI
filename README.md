# LearnMate AI — Your Personal Learning Companion

LearnMate AI is a production-grade, mobile-first student learning companion web application. It combines personalized study workflows, MongoDB Atlas persistence, JWT authentication, and Google Gemini AI to help students summarize study material, generate interactive quizzes with pedagogical explanations, plan spaced revision schedules, and consult an empathetic AI tutor 24/7.

---

## 🚀 Key Features

### 1. Personalized Learning Dashboard
- Time-aware greetings with learner's name.
- **Daily Study Streak**: Calculated from completed study tasks.
- **Today's Goal Tracker**: Circular progress monitor for daily study minutes.
- **Weekly Learning Activity Chart**: 7-day breakdown of minutes logged and tasks finished.
- Quick action launchers to summarize notes, create quizzes, or plan revisions.

### 2. AI Learning Workspace (Gemini 3.8 Flash)
- **AI Notes Summarizer**: Pasted lecture notes are transformed into executive summaries, key conceptual takeaways, academic term definitions, and high-yield revision bullet points. Results can be saved straight to your database notes.
- **AI Quiz Generator**: Generates adaptive multiple-choice quizzes with easy, medium, and hard difficulty options. Features instant feedback, graded score tracking, and detailed explanations for every option.
- **Ask AI Tutor**: Conversational companion that breaks down complex ideas into intuitive analogies, real-world examples, and step-by-step reasoning.
- **Smart Revision Planner**: Computes a spaced-repetition study schedule leading up to target exam dates with a 1-click "Add to My Schedule" sync into MongoDB.

### 3. Comprehensive Notes Management
- Full CRUD operations with title, subject, formatted notes, tags, and AI summaries.
- Search filter by title, content, or tag keywords.
- Subject filter pills (Computer Science, Biology, History, Mathematics, etc.).
- Delete confirmation safety modal.
- Direct 1-click launchers to generate quizzes or syntheses from any stored note.

### 4. Progress & Analytics
- Quantified retention metrics calculated directly from database records.
- Quiz score trends and averages over time.
- Subject-wise performance tracking (study minutes, quiz accuracy, notes cataloged).

### 5. Progressive Web App (PWA) & Mobile-First UX
- Installable on iOS Safari, Android Chromium, and Desktop.
- Mobile bottom navigation bar (Home, Learn, Notes, Quiz, Progress, Profile) optimized for 360px, 390px, 430px viewports with zero horizontal overflow.
- Offline connectivity banner.
- Light and dark theme modes with local persistence.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React icons, Vite PWA plugin.
- **Backend**: Node.js & Express.js with TypeScript (`server.ts` entry point).
- **Database**: MongoDB Atlas with Mongoose models, indexes, and validation. (Includes resilient zero-config fallback memory store for instant preview evaluations).
- **Authentication**: Salted Bcrypt password hashing and JSON Web Tokens (JWT) with user isolation.
- **AI Engine**: `@google/genai` TypeScript SDK invoking Gemini 3.8 Flash server-side.

---

## 📦 Minimal Environment Variables

Create a `.env` file in the root directory (based on `.env.example`):

```bash
# MongoDB Atlas Connection URI
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/learnmate?retryWrites=true&w=majority"

# JWT Secret Key
JWT_SECRET="your_production_secret_key_change_me"

# Google Gemini API Key
GEMINI_API_KEY="your_gemini_api_key"

# Client Base URL
CLIENT_URL="http://localhost:3000"

# Server Port (optional, defaults to 3000)
PORT=3000
```

---

## 🗄️ MongoDB Atlas Setup Guide

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Sandbox Cluster**.
3. Under **Database Access**, create a database user with read/write privileges.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) or specific server IPs.
5. In **Clusters > Connect > Drivers**, select **Node.js** and copy the connection string.
6. Replace `<username>` and `<password>` with your credentials, specify the database name `learnmate`, and set `MONGODB_URI` in `.env`.

### 4 Main MongoDB Collections
1. `users`: `name`, `email` (unique index), `passwordHash`, `createdAt`.
2. `notes`: `userId` (index), `title`, `subject`, `content`, `tags`, `aiSummary`, `createdAt`, `updatedAt`.
3. `quizzes`: `userId` (index), `title`, `subject`, `questions` (array of `{ question, options, correctAnswerIndex, explanation }`), `score`, `totalQuestions`, `completedAt`, `createdAt`.
4. `studySessions`: `userId` (index), `subject`, `durationMinutes`, `taskTitle`, `completed`, `scheduledAt`, `createdAt`.

---

## 🌐 API Documentation

All protected endpoints require an `Authorization: Bearer <token>` header.

### Authentication
- `POST /api/auth/signup`: `{ name, email, password }` -> `{ user, token }`
- `POST /api/auth/login`: `{ email, password }` -> `{ user, token }`
- `GET /api/auth/me`: Returns current user details.

### Notes
- `GET /api/notes?q=&subject=&page=&limit=`: Search, filter, and paginate user notes.
- `POST /api/notes`: Create new note with optional AI summary and tags.
- `GET /api/notes/:id`: Fetch specific note.
- `PUT /api/notes/:id`: Update note fields.
- `DELETE /api/notes/:id`: Delete note.

### AI Suite
- `POST /api/ai/summarize`: `{ text, subject }` -> structured executive summary, concepts, definitions, and revision points.
- `POST /api/ai/generate-quiz`: `{ content, subject, difficulty, numQuestions }` -> adaptive multiple-choice questions with answer keys and explanations.
- `POST /api/ai/tutor`: `{ message, history, subject }` -> pedagogical concept explanations and analogies.
- `POST /api/ai/plan-revision`: `{ topic, targetDate, dailyMinutes, subject }` -> day-by-day revision milestones.

### Quizzes
- `GET /api/quizzes`: List user quizzes.
- `POST /api/quizzes`: Save quiz questions.
- `GET /api/quizzes/:id`: Retrieve single quiz.
- `POST /api/quizzes/:id/submit`: Grade submitted answers and record score.

### Study Sessions & Analytics
- `GET /api/study-sessions`: Retrieve scheduled study tasks.
- `POST /api/study-sessions`: Schedule single or batch revision tasks.
- `PATCH /api/study-sessions/:id`: Toggle completed or edit task.
- `DELETE /api/study-sessions/:id`: Delete study session.
- `GET /api/analytics/overview`: Aggregated analytics including daily streak, total minutes, weekly activity, and subject breakdown.

---

## 📱 PWA Installation Instructions

1. **Android / Desktop Chrome / Edge**: Click the **Install App** button in the top navbar or select "Install LearnMate" in the browser menu.
2. **iOS Safari**: Tap the **Share** icon at the bottom of Safari, scroll down, and select **Add to Home Screen**.

---

## 🚢 Deployment Instructions

### Deployment to Render / Railway (Unified Full-Stack)
1. Push code to GitHub.
2. In [Render](https://render.com), create a new **Web Service**.
3. Set:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`.
4. Deploy service!
