import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRoutes from './infrastructure/routes/health.routes';
import authRoutes from './infrastructure/routes/auth.routes';
import notFoundRoutes from './infrastructure/routes/notFound.routes';
import { startKeepAlive } from './utils/scripts/keepalive';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    'https://front-mcp-gules.vercel.app',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter((origin): origin is string => Boolean(origin)),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use(notFoundRoutes);

const validateEnvVars = (): void => {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
  }
};

const startServer = (): void => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      validateEnvVars();
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

      startKeepAlive();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;