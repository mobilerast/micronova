# 🚀 Micronova Backend

**Academic yet kid-friendly language learning app backend for ages 8–13**

A Node.js + Express + MySQL backend that powers personalized 60-day language learning journeys for children. Features leveling assessments, adaptive daily plans, and progress tracking.

## ✨ Features

- **🎯 Smart Leveling**: Assessment-based placement (A0/A1/A2-kids)
- **📚 60-Day Plans**: Personalized daily learning paths
- **🎮 Kid-Friendly**: Short questions, ≤4 options, simple language
- **📊 Progress Tracking**: Sessions, streaks, and accuracy metrics
- **🔒 Secure**: API key protection for admin endpoints
- **🐳 Docker Ready**: One-command database setup

## 🏗 Tech Stack

- **Backend**: Node.js + Express.js (CommonJS)
- **Database**: MySQL + Prisma ORM
- **Validation**: express-validator
- **Security**: helmet, API keys, no PII logging
- **Development**: Docker Compose, nodemon

## 📦 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start MySQL database
docker compose up -d

# 3. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 4. Start development server
npm run dev
```

🎉 **API ready at http://localhost:3000**

See [docs/QUICKSTART.md](docs/QUICKSTART.md) for detailed setup and API examples.

## 🧩 Architecture

### Core Components

```
src/
├── server.js              # Express app setup
├── middleware/
│   └── auth.js            # API key authentication
├── routes/
│   ├── children.js        # Child management
│   ├── assessments.js     # Leveling quizzes
│   ├── plans.js          # Learning plans
│   ├── sessions.js       # Daily sessions
│   └── seed.js           # Admin/seed endpoints
├── services/
│   └── planGenerator.js  # Plan generation logic
├── utils/
│   └── db.js             # Database connection
└── scripts/
    └── seed.js           # Database seeding
```

### Domain Model

```
Child → Assessment → LearningPlan → LearningPlanDay → LearningSession
```

### Daily Learning Structure

Each day contains:
- **Vocab Task**: Word + definition → multiple choice
- **Reading Task**: Short story → comprehension question  
- **Speaking Prompt**: Open-ended question for response

## 🎯 Learning Levels

| Level | Age | Content Focus | Examples |
|-------|-----|---------------|----------|
| **A0** | 8-9 | Basic concepts | Colors, animals, family |
| **A1** | 10-11 | Elementary topics | School, weather, hobbies |
| **A2-kids** | 12-13 | Intermediate themes | Travel, nature, technology |

## 📊 API Overview

### Main Endpoints
- `/api/children` - Child management
- `/api/assessments` - Leveling quizzes  
- `/api/plans` - 60-day learning plans
- `/api/sessions` - Daily learning sessions

### Admin Endpoints (API key required)
- `/api/seed/*` - Database seeding and stats

See [docs/api-requests.http](docs/api-requests.http) for complete API examples.

## 🔧 Scripts

```bash
npm run dev          # Development server
npm run start        # Production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed sample data
npm run db:reset     # Reset and seed database
```

## 🌱 Sample Data

The seed script creates:
- 5 sample children (Emma, Liam, Sophia, Noah, Olivia)
- Assessments with random scores
- 60-day learning plans for each child
- Sample learning sessions

## 🔐 Environment

Key environment variables in `.env`:

```bash
DATABASE_URL="mysql://micronova_user:micronova_pass@localhost:3306/micronova_db"
ADMIN_API_KEY=admin_micronova_2025_key
SEED_API_KEY=seed_micronova_2025_key
PORT=3000
```

## 🛡 Security Features

- Input validation on all endpoints
- API key protection for admin routes
- No PII in application logs
- Helmet.js security headers
- Safe error messages

## 👶 Kid-Friendly Design

- Questions limited to 1-2 sentences
- Maximum 4 answer options
- No time pressure/timers
- Age-appropriate themes and vocabulary
- Positive reinforcement focus

## 🔄 Typical User Flow

1. **Registration**: Create child profile
2. **Assessment**: Take leveling quiz (8 questions)
3. **Plan Generation**: Auto-create 60-day personalized plan
4. **Daily Learning**: Complete vocab + reading + speaking tasks
5. **Progress Tracking**: Monitor accuracy, streaks, completion

## 🐳 Docker

MySQL database runs in Docker:

```bash
docker compose up -d     # Start database
docker compose down      # Stop database
docker compose logs mysql # View database logs
```

## 📚 Documentation

- [QUICKSTART.md](docs/QUICKSTART.md) - Setup guide and API examples
- [api-requests.http](docs/api-requests.http) - REST Client test file
- Database schema in `prisma/schema.prisma`

## 🧪 Testing

Use the provided HTTP requests file with REST Client extension or curl commands from the quickstart guide.

## 🚀 Production Considerations

- Set up proper MySQL instance (not Docker)
- Use environment-specific `.env` files
- Implement proper logging and monitoring
- Add rate limiting for production
- Consider Redis for session caching
- Add comprehensive error tracking

---

**Built with ❤️ for young language learners**
