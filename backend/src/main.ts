import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // CORS - lejon frontend-in në portin 5173
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('LogiTrack AI API')
    .setDescription(`
      🚚 **LogiTrack AI** - Platformë për menaxhimin e logjistikës dhe fletëve të rrugës.
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // Backend-i duhet të përdorë PORT 5000
  const port = configService.get('PORT') || 5000;
  await app.listen(port);

  console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │                    🚀 LogiTrack AI API                      │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │   Server running on: http://localhost:${port}                  │
  │   Swagger UI:       http://localhost:${port}/api-docs          │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
  `);
}

bootstrap();