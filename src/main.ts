import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as colors from 'colors';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const corsOriginsEnv =
    configService.get<string>('CORS_ORIGINS') ||
    configService.get<string>('FRONTEND_URL');

  const allowedOrigins = corsOriginsEnv
    ? corsOriginsEnv.split(',').map((o) => o.trim())
    : ['*'];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*')) return callback(null, true);
      if (allowedOrigins.some((o) => o === origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    exposedHeaders: 'Content-Disposition',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
  }));

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Smart Edu Hub API')
    .setDescription('A comprehensive API for managing school operations, authentication, and educational resources')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'School and user authentication endpoints')
    .addTag('Admin', 'Administrative operations and management')
    .addTag('School Management', 'School-related operations and data management')
    .addTag('Students', 'Student management and operations')
    .addTag('Teachers', 'Teacher management and operations')
    .addTag('Classes', 'Class management and operations')
    .addTag('Subjects', 'Subject management and operations')
    .addTag('Finance', 'Financial operations and payment management')
    .addTag('Schedules', 'Schedule and timetable management')
    .addTag('Notifications', 'Notification system management')
    .addTag('Dashboard', 'Dashboard and analytics endpoints')
    .addTag('Settings', 'System settings and configuration')
    .addTag('Profiles', 'User profile management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'Smart Edu Hub API Documentation',
  });

  await app.listen(process.env.PORT ?? 1000);

  console.log(colors.green('🚀 Server successfully started!'));
  console.log(colors.cyan(`📍 Server running on: http://localhost:${process.env.PORT ?? 1000}`));
  console.log(colors.yellow(`📝 API Documentation: http://localhost:${process.env.PORT ?? 1000}/api/docs`));
  console.log(colors.blue(`💾 Database: ${process.env.DATABASE_URL}`));
  console.log(colors.magenta(`🔗 API Base URL: http://localhost:${process.env.PORT ?? 1000}/api/v1`));
}
bootstrap();
