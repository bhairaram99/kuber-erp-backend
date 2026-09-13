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
  const frontendUrl = configService.get<string>('frontendUrl');
  const allowedOrigins = frontendUrl
    ? frontendUrl.split(',').map((url) => url.trim()).filter(Boolean)
    : ['http://localhost:3000'];

  // Global prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // Security & CORS (Strictly loaded from FRONTEND_URL in .env)
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server, curl, Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked: Origin '${origin}' is not authorized in FRONTEND_URL`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
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
