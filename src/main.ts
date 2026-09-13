import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 5000;
  const frontendUrl = configService.get<string>('frontendUrl') || 'http://localhost:3000';
  const allowedOrigins = frontendUrl
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  // Global prefix: /api/v1 (Exclude root and health endpoints so cloud probes work at both /health and /api/v1/health)
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/v1/health', ''],
  });

  // Security & CORS (Loaded from FRONTEND_URL in .env, automatically handles trailing slashes)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, Postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.trim().replace(/\/+$/, '');

      const isAllowed = allowedOrigins.some((allowed) => {
        const cleanAllowed = allowed.replace(/\/+$/, '');
        return (
          cleanAllowed === normalizedOrigin ||
          cleanAllowed === normalizedOrigin.replace(/^https?:\/\//, '') ||
          `https://${cleanAllowed}` === normalizedOrigin ||
          `http://${cleanAllowed}` === normalizedOrigin
        );
      });

      if (isAllowed) {
        return callback(null, true);
      }

      logger.warn(`[CORS] Blocked request from origin '${origin}'. Allowed origins: ${allowedOrigins.join(', ')}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global response interceptor and exception filter
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Documentation: /api/docs
  const config = new DocumentBuilder()
    .setTitle('Wood Business ERP API')
    .setDescription(
      'Production-grade REST API for Wood and Timber Materials Business ERP, Inventory Management, POS, Procurement, and Financial Reporting.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port, '0.0.0.0');
  logger.log(`====================================================`);
  logger.log(`🪵 Wood Business ERP API running on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger documentation at http://localhost:${port}/api/docs`);
  logger.log(`====================================================`);
}
bootstrap();
