# Natural Language Product Search

A full-stack application that enables natural language search for products with faceted filtering capabilities.

## Features

- Natural language product search
- Faceted filtering (price range, categories, locations, etc.)
- Real-time search results
- Responsive UI with Tailwind CSS

## Tech Stack

- Frontend: Next.js, Redux Toolkit, Tailwind CSS
- Backend: Node.js, Express, MongoDB
- Search: Custom NLP processing

## Setup

### Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Environment Variables

Create `.env` files in both frontend and backend directories:

Frontend (.env.local):

Already added .env.example, for reference

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:9000
```

Backend (.env):

```
MONGODB_URI=mongodb://localhost:27017/your-db-name
PORT=9000
```

### Installation

1. Clone the repository
2. Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
npm install
```

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run dev
```

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:9000

## Project Structure

```
├── frontend/           # Next.js frontend application
│   ├── components/    # React components
│   ├── store/        # Redux store and slices
│   └── types/        # TypeScript type definitions
│
└── backend/          # Express backend server
    ├── controllers/  # Route controllers
    ├── models/      # MongoDB models
    ├── services/    # Business logic
    └── utils/       # Utility functions
```
