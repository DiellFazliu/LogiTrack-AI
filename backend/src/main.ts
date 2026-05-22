import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLog } from './modules/audit/audit-log.entity';
import { Reflector } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: configService.get('CLIENT_URL') || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global Audit Interceptor (për regjistrim automatik të aktiviteteve)
  const auditRepository = app.get(getRepositoryToken(AuditLog));
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new AuditInterceptor(auditRepository, reflector));

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('LogiTrack AI API')
    .setDescription(`
      🚚 **LogiTrack AI** - Platformë për menaxhimin e logjistikës dhe fletëve të rrugës.

      ## Features
      - Multi-tenant architecture
      - AI-powered route optimization
      - Real-time shipment tracking
      - Digital waybills with QR codes
      - Role-based access control
      - Automatic audit logging

      ## Authentication
      Use JWT token in Authorization header: \`Bearer <token>\`
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Organizations', 'Organization management')
    .addTag('Shipments', 'Shipment management')
    .addTag('Drivers', 'Driver management')
    .addTag('Vehicles', 'Vehicle management')
    .addTag('Warehouses', 'Warehouse management')
    .addTag('Products', 'Product management')
    .addTag('Inventory', 'Inventory management')
    .addTag('Waybills', 'Digital waybill management')
    .addTag('Tracking', 'Real-time tracking')
    .addTag('AI', 'AI-powered features')
    .addTag('Reports', 'Reports and analytics')
    .addTag('Notifications', 'User notifications')
    .addTag('Invoices', 'Invoice and payment management')
    .addTag('Reviews', 'Ratings and reviews')
    .addTag('Routes', 'Route and stop management')
    .addTag('Returns', 'Return shipment management')
    .addTag('Documents', 'Document management')
    .addTag('Settings', 'System configuration')
    .addTag('Audit', 'Audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  const port = configService.get('PORT') || 5000;
  await app.listen(port);

  console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │                    🚀 LogiTrack AI API                      │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │   Server running on: http://localhost:${port}               │
  │   Swagger UI:       http://localhost:${port}/api-docs       │
  │   Health check:     http://localhost:${port}/health         │
  │                                                             │
  │   Environment:      ${process.env.NODE_ENV || 'development'}│
  │   Date:             ${new Date().toLocaleString()}          │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
  `);
}

bootstrap();