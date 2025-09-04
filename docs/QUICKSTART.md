# Micronova Backend - Quick Start Guide

**Academic yet kid-friendly language learning app backend (ages 8-13)**

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Database
```bash
docker compose up -d
```

### 3. Setup Database Schema
```bash
npm run db:generate
npm run db:push
```

### 4. Seed Sample Data
```bash
npm run db:seed
```

### 5. Start Development Server
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

### Get Sample Assessment Questions
```bash
curl http://localhost:3000/api/assessments/sample/questions
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

### Create Learning Session
```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "childId": 1,
    "planDayId": 1,
    "vocabAnswer": "yellow",
    "readingAnswer": "The sun comes out",
    "speakingAnswer": "My favorite color is blue because it reminds me of the ocean.",
    "vocabCorrect": true,
    "readingCorrect": true,
    "totalTimeMs": 120000
  }'
```

## 🔐 Admin/Seed Endpoints

These require the `x-api-key` header with appropriate API key:

### Seed Sample Data
```bash
curl -X POST http://localhost:3000/api/seed/sample-data \
  -H "x-api-key: seed_micronova_2025_key"
```

### Get Database Stats
```bash
curl http://localhost:3000/api/seed/database-stats \
  -H "x-api-key: seed_micronova_2025_key"
```

### Reset and Seed Fresh Data
```bash
curl -X POST http://localhost:3000/api/seed/reset-and-seed \
  -H "x-api-key: seed_micronova_2025_key"
```

### Clear All Data (Dangerous!)
```bash
curl -X DELETE http://localhost:3000/api/seed/clear-all \
  -H "x-api-key: seed_micronova_2025_key"
```

## 📁 API Endpoints

### Children
- `GET /api/children` - List all children
- `GET /api/children/:id` - Get child by ID
- `POST /api/children` - Create new child
- `PUT /api/children/:id` - Update child
- `DELETE /api/children/:id` - Delete child

### Assessments (Leveling Quiz)
- `GET /api/assessments` - List assessments
- `GET /api/assessments/:id` - Get assessment by ID
- `POST /api/assessments` - Create assessment
- `GET /api/assessments/child/:childId` - Get child's assessments
- `GET /api/assessments/sample/questions` - Get sample questions

### Learning Plans
- `GET /api/plans` - List all plans
- `GET /api/plans/:id` - Get plan by ID
- `POST /api/plans` - Create new plan
- `GET /api/plans/child/:childId` - Get child's plans
- `GET /api/plans/:id/day/:dayNumber` - Get specific plan day
- `GET /api/plans/:id/progress` - Get plan progress
- `DELETE /api/plans/:id` - Delete plan

### Learning Sessions
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Get session by ID
- `POST /api/sessions` - Create new session
- `GET /api/sessions/child/:childId` - Get child's sessions
- `GET /api/sessions/child/:childId/stats` - Get child's session stats
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Seed/Admin (Requires API Key)
- `POST /api/seed/sample-data` - Create sample data
- `GET /api/seed/database-stats` - Get database statistics
- `POST /api/seed/reset-and-seed` - Reset and create fresh data
- `DELETE /api/seed/clear-all` - Clear all data

## 🎯 Typical User Flow

1. **Create Child**: POST `/api/children`
2. **Take Assessment**: POST `/api/assessments` (determines level A0/A1/A2-kids)
3. **Generate Plan**: POST `/api/plans` (creates 60-day plan)
4. **Daily Learning**: 
   - GET `/api/plans/:id/day/:dayNumber` (get day's activities)
   - POST `/api/sessions` (record answers and progress)
5. **Track Progress**: GET `/api/plans/:id/progress` and GET `/api/sessions/child/:id/stats`

## 📊 Data Structure

### Daily Plan Structure
Each day contains:
- **Vocab Task**: Word definition with 4 multiple choice options
- **Reading Task**: Short story/text with comprehension question
- **Speaking Prompt**: Open-ended question for voice/text response

### Levels
- **A0**: Basic (ages 8-9) - Colors, animals, family
- **A1**: Elementary (ages 10-11) - School, weather, hobbies  
- **A2-kids**: Intermediate (ages 12-13) - Travel, nature, technology

## 🛠 Development Commands

```bash
npm run dev          # Start development server
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:seed      # Seed database
npm run db:reset     # Reset database and seed
```

## 🔧 Environment Variables

Check `.env` file for configuration:
- `DATABASE_URL` - MySQL connection string
- `ADMIN_API_KEY` - API key for admin endpoints
- `SEED_API_KEY` - API key for seed endpoints
- `PORT` - Server port (default: 3000)

## 🐳 Docker

Database runs in Docker. To manage:

```bash
docker compose up -d     # Start database
docker compose down      # Stop database
docker compose logs      # View database logs
```

## 📝 Notes

- All API responses are JSON
- Input validation using express-validator
- No PII in logs (kid-safe)
- Questions are short with ≤4 options
- No timers (stress-free learning)
- Simple wording for ages 8-13

Happy coding! 🚀📚
