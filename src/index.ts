import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Import configurations
import './config/passport';
import { specs } from './config/swagger';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import albumRoutes from './routes/albums';
import photoRoutes from './routes/photos';
import emailRoutes from './routes/email';
import aiRoutes from './routes/ai';

// Import middleware
import { handleError, handleNotFound, handleJsonErrors } from './middlewares/errorHandler';
import { conditionalAuth } from './middlewares/routeAuth';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// Body parsing middleware
// app.use('/api/ai', express.raw({ type: '*/*' }));

app.use('/api/ai', aiRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Apply conditional authentication middleware
app.use(conditionalAuth);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Photo Project API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Photo Project API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/email', emailRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Photo Project API',
    documentation: '/api-docs',
    health: '/health'
  });
});

// Error handling middleware
app.use(handleJsonErrors);
app.use(handleNotFound);
app.use(handleError);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Photo Project API server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

