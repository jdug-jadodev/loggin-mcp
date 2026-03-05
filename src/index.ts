import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Configurar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();

// Configurar puerto desde variable de entorno o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

// Middlewares esenciales
app.use(express.json({ limit: '10mb' })); // Parser para JSON con límite de 10MB
app.use(cors()); // Habilitar CORS para todas las rutas

// Middleware de logging básico (reemplazará morgan en desarrollo)
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Ruta de Health Check
app.get('/health', (req: Request, res: Response) => {
  const uptime = process.uptime();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime * 100) / 100, // Redondear a 2 decimales
    version: '1.0.0',
    service: 'loggin-mcp'
  });
});

// Ruta por defecto para rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Validar variables de entorno requeridas
const validateEnvVars = (): void => {
  const requiredVars = ['JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Error: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please create a .env file based on .env.example');
    process.exit(1);
  }
};

// Función para iniciar el servidor
const startServer = (): void => {
  try {
    // Validar variables de entorno (solo JWT_SECRET es obligatorio para Fase 1)
    if (process.env.NODE_ENV !== 'development') {
      validateEnvVars();
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('uncaughtException', (error: Error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('\n📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Iniciar servidor
startServer();

export default app;