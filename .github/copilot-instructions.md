# Receipt System Development Guidelines

## Project Overview
Full-stack Receipt Management System with React + Vite + Tailwind CSS frontend and Node.js + Express backend.

## Frontend Development

### Tech Stack
- React 18 with JSX
- Vite for fast development and building
- Tailwind CSS for styling
- Axios for API calls

### Getting Started
```bash
cd frontend
npm install
npm run dev
```

### File Structure
- `src/components/` - Reusable React components
- `src/pages/` - Page-level components
- `src/App.jsx` - Main application component
- `src/main.jsx` - Entry point
- `tailwind.config.js` - Tailwind configuration
- `vite.config.js` - Vite configuration

### Development Commands
- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Backend Development

### Tech Stack
- Node.js with ES modules
- Express.js for REST API
- MongoDB-ready with Mongoose models (optional)
- CORS enabled for frontend communication
- Environment variables with dotenv

### Getting Started
```bash
cd backend
npm install
npm run dev
```

### File Structure
- `server.js` - Main Express application
- `routes/` - API route definitions
- `controllers/` - Business logic handlers
- `models/` - Database schema models
- `middleware/` - Custom middleware functions

### Development Commands
- `npm run dev` - Start development server with watch mode (port 5000)
- `npm start` - Start production server

### Environment Setup
Create `.env` file from `.env.example`:
```
PORT=5000
NODE_ENV=development
```

## API Communication

### Frontend to Backend
- Frontend proxy is configured in Vite to route `/api/*` to `http://localhost:5000`
- Use `axios` or `fetch` to make requests to `/api/*` endpoints

### API Endpoints
- `GET /api/health` - Server health check
- `GET /api/receipts` - Get all receipts
- `POST /api/receipts` - Create new receipt
- `GET /api/receipts/:id` - Get receipt details
- `PUT /api/receipts/:id` - Update receipt
- `DELETE /api/receipts/:id` - Delete receipt

## Running Both Servers

### Terminal 1 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Terminal 2 - Backend
```bash
cd backend
npm install
npm run dev
```

Access the app at `http://localhost:5173`

## Database Setup (Optional)

To use MongoDB:
1. Install MongoDB locally or use MongoDB Atlas
2. Update `.env` with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb://localhost:27017/receipt-system
   ```
3. Uncomment the Receipt model in `backend/models/Receipt.js`
4. Implement database operations in controllers

## Code Style Guidelines

- Use ES6+ syntax and async/await
- Follow camelCase naming conventions
- Keep components small and focused
- Use Tailwind CSS classes for styling
- Add proper error handling
- Include JSDoc comments for complex functions

## Building for Production

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

### Backend
Production deployment typically involves:
- Installing dependencies: `npm install --production`
- Setting NODE_ENV to production
- Running with `npm start`

## Troubleshooting

### Frontend Issues
- Port 5173 already in use: Change `vite.config.js` server port
- Styling not applied: Ensure Tailwind CSS is building correctly
- API calls failing: Check Vite proxy configuration and backend server

### Backend Issues
- Port 5000 already in use: Change `PORT` in `.env`
- CORS errors: Verify CORS middleware is enabled
- Module not found: Ensure `"type": "module"` is in `package.json`

---

**Last Updated**: March 31, 2026
