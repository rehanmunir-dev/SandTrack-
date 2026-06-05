# Receipt System - Full Stack

A complete full-stack application for managing receipts built with modern web technologies.

## Project Structure

```
receipt-system/
├── frontend/              # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/              # Node.js + Express.js
│   ├── routes/          # API routes
│   ├── controllers/      # Business logic
│   ├── models/          # Database models
│   ├── middleware/      # Custom middleware
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - Database (optional, configured in .env)
- **CORS** - Cross-origin requests
- **Dotenv** - Environment variable management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on the configured API host. For local development this is usually `http://localhost:5000`; in production Nginx should proxy `/api` to the Express backend.

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/receipt_system
```

## API Documentation

### Base URL
Local API default: `http://localhost:5000/api`

Production API default: `/api` behind Nginx.

### Endpoints
- `GET /health` - Health check
- `GET /receipts` - Get all receipts
- `POST /receipts` - Create a new receipt
- `GET /receipts/:id` - Get receipt by ID
- `PUT /receipts/:id` - Update receipt
- `DELETE /receipts/:id` - Delete receipt

## Development

### Watch Mode
- Frontend: `npm run dev` (in frontend/)
- Backend: `npm run dev` (in backend/)

### Build
- Frontend: `npm run build` (in frontend/)

## License

MIT
