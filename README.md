# Job Scraper & API Service

A web scraper and API service that aggregates job listings from Microsoft, Google, and Amazon careers pages.

## Features

- Scrapes job listings from multiple companies
- Stores data in PostgreSQL database
- RESTful API with pagination
- Duplicate detection and handling
- Automated periodic scraping

## Tech Stack

- TypeScript
- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- Puppeteer

## Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:

```bash
   npm install
```

3. Set up environment variables in .env:

```
   DATABASE_URL="postgresql://user:password@localhost:5432/jobsdb"
```

4. Run database migrations:

```prisma
   npx prisma migrate dev
```

## Usage

Run the Scraper and Start the Server :

```bash
npm run dev
```

Run the Scraper:

```bash
npm run scrape
```

Start the Server:

```bash
npm run api
```

## API Endpoints

1. Get All Jobs
   GET /api/jobs?page=1&limit=10

   Parameters:

```
   page (optional): Page number (default: 1)
   limit (optional): Items per page (default: 10, max: 50)
```

Response:

```
{
    "status": "success",
    "data": [...jobs],
    "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
    }
}
```

2. Filter Jobs
   GET /api/jobs/filter?company=Google&location=London

   Parameters:

```
   company (optional): Filter by company name
   location (optional): Filter by location
   fromDate (optional): Filter by posted date
```

## Database Schema

```
model Jobs {
    id String @id @default(uuid())
    job String
    company String
    location String
    description String
    postedDate DateTime
    jobUrl String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
}
```

## Project Structure

├── src/
│   ├── api/
│   │   ├── routes/
│   │   └── server.ts
│   ├── scrapers/
│   │   ├── amazon.ts
│   │   ├── google.ts
│   │   └── microsoft.ts
│   ├── services/
│   │   └── jobService.ts
│   ├── utils/
│   │   └── parseDateString.ts
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json

## Error Handling

The API includes comprehensive error handling for:

- Invalid pagination parameters
- Database connection issues
- Scraping failures
- Invalid filter parameters

