import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/apiRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import APIError from './utils/APIError.js';

const app = express();

// App middlewares
app.use(cors({
  origin: process.env.CORS_ALLOW_ORIGINs.split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API routes
app.use(apiRoutes);

// Catch-all route for unmatched routes
app.use('*', (req, res, next) => {
  const error = new APIError('Route not found', 404, 'ROUTE_NOT_FOUND');
  next(error);
});

// Error handler middleware
app.use(errorHandler);

export default app;
