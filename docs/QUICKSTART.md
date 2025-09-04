# Micronova Backend - Quick Start Guide

**Academic yet kid-friendly language learning app backend (ages 8-13)**

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your database URL and API key
```

### 3. Start Database
```bash
npm run db:up
# or manually: docker compose up -d
```

### 4. Setup Database Schema
```bash
npm run prisma:generate
npx prisma db push
```

### 5. Seed Sample Data
```bash
npm run seed
```

### 6. Start Development Server
```bash
npm run dev
```

The API will be running at `http://localhost:3000`

## 🧪 Test the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Get All Children
```bash
curl http://localhost:3000/api/children
```

### Create a New Child
```bash
curl -X POST http://localhost:3000/api/children \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Johnson",
    "age": 9,
    "language": "english"
  }'
```

### Get Assessment Questions
```bash
curl http://localhost:3000/api/assessments/questions
```

### Create Assessment (Leveling Quiz)
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "childId": 1,
    "answers": [
      {
        "questionId": 1,
        "selectedAnswer": "Yellow",
        "correctAnswer": "Yellow",
        "isCorrect": true
      },
      {
        "questionId": 2,
        "selectedAnswer": "Cat",
        "correctAnswer": "Cat",
        "isCorrect": true
      }
    ]
  }'
```

### Create Learning Plan
```bash
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{
    "childId": 1,
    "level": "A1"
  }'
```

### Get Plan Day Activities
```bash
curl http://localhost:3000/api/plans/1/day/1
```

## 📁 API Endpoints

### Main Endpoints
- `GET /health` - Health check
- `GET /api/children` - List children
- `POST /api/children` - Create child
- `GET /api/guardians` - List guardians
- `POST /api/guardians` - Create guardian
- `GET /api/assessments` - List assessments
- `GET /api/assessments/questions` - Get sample questions
- `POST /api/assessments` - Create assessment
- `GET /api/plans` - List learning plans
- `POST /api/plans` - Create learning plan
- `GET /api/plans/:id/day/:dayNumber` - Get plan day

## 🔧 Development Commands

```bash
npm run dev              # Start development server
npm run start            # Start production server
npm run seed             # Seed database with sample data
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Create database migration
npm run db:up            # Start database with Docker
```

## � Environment Variables

Required in `.env` file:
- `DATABASE_URL` - MySQL connection string
- `API_KEY` - API key for protected routes
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## 🐳 Docker

Database runs in Docker:

```bash
docker compose up -d     # Start database
docker compose down      # Stop database
docker compose logs      # View database logs
```

## 📝 Project Structure

```
src/
├── app.js                  # Express app setup
├── server.js              # Server startup
├── routes/
│   ├── index.js           # Main routes + health check
│   ├── children.js        # Child management
│   ├── guardians.js       # Guardian management
│   ├── assessments.js     # Leveling quizzes
│   └── plans.js          # Learning plans
├── middleware/
│   ├── apiKey.js         # API key authentication
│   └── errorHandler.js   # Global error handling
├── services/
│   ├── assessmentService.js  # Assessment logic
│   └── planService.js       # Plan generation
└── lib/
    └── prisma.js         # Database client
```

## 🎯 Typical User Flow

1. **Create Guardian**: POST `/api/guardians`
2. **Create Child**: POST `/api/children`
3. **Take Assessment**: POST `/api/assessments` (determines level A0/A1/A2-kids)
4. **Generate Plan**: POST `/api/plans` (creates 60-day plan)
5. **Daily Learning**: GET `/api/plans/:id/day/:dayNumber` (get day's activities)

## 📚 Documentation

- Database schema in `prisma/schema.prisma`
- Sample data seeding in `prisma/seed/seedQuestions.js`
- API examples in this quickstart guide

Happy coding! 🚀📚
