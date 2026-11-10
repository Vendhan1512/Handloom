import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { logger } from '@handloom/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Enable graceful shutdown hooks (SIGTERM, SIGINT)
  app.enableShutdownHooks();

  // API Version Prefix
  const apiPrefix = process.env['API_PREFIX'] || '/api/v1';
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Global Interceptors & Filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // CORS Configuration
  const corsOrigin = process.env['CORS_ORIGIN'] || 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Handloom Operations Platform API')
    .setDescription(
      'Enterprise REST API powering the digitized handloom production, inventory, weaving, and financial lifecycle.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(process.env['PORT']) || 4000;
  await app.listen(port, '0.0.0.0');
  logger.info(
    `[Handloom API] Server listening on port ${port} with prefix ${apiPrefix}`,
  );
  logger.info(
    `[Handloom API] Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal error during NestJS API bootstrap');
  process.exit(1);
});

