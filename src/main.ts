import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as colors from 'colors';
import { ConfigService } from '@nestjs/config';
import { HlsTranscodeService } from './shared/services/hls-transcode.service';
import { S3Service } from './shared/services/s3.service';
import { CloudFrontService } from './shared/services/cloudfront.service';
import { MediaConvertTranscodeProvider } from './shared/services/transcode-providers/mediaconvert.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // TODO: Restrict CORS origins in production for security
  // For now, allowing all origins for development
  app.enableCors({
    origin: true, // Allow all origins (required for credentials: true)
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Accept-Language',
      'Content-Language',
      'school_id', // Custom header for school context (teachers, directors, students)
    ],
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
    preflightContinue: false, // Let Nest handle preflight (sends CORS headers on OPTIONS)
    optionsSuccessStatus: 204, // Some clients expect 204 for OPTIONS
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', ''],
  });
  
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

  await app.listen(process.env.PORT ?? 3000);

  console.log(colors.green('🚀 Server successfully started!'));
  console.log(colors.cyan(`📍 Server running on: http://localhost:${process.env.PORT ?? 3000}`));
  console.log(colors.yellow(`📝 API Documentation: http://localhost:${process.env.PORT ?? 3000}/api/docs`));
  console.log(colors.blue(`💾 Database: ${process.env.DATABASE_URL}`));
  console.log(colors.magenta(`🔗 API Base URL: http://localhost:${process.env.PORT ?? 3000}/api/v1`));

  // Log AWS services status at the end of startup (grouped together)
  console.log(colors.gray('────────────────────────────────────────'));
  console.log(colors.white('📦 AWS Services Status:'));

  try {
    const s3Service = app.get(S3Service);
    s3Service.logStatus();
  } catch {
    // S3Service not available
  }

  try {
    const cloudFrontService = app.get(CloudFrontService);
    cloudFrontService.logStatus();
  } catch {
    // CloudFrontService not available
  }

  try {
    const mediaConvertProvider = app.get(MediaConvertTranscodeProvider);
    mediaConvertProvider.logStatus();
  } catch {
    // MediaConvertTranscodeProvider not available (may be using ffmpeg)
  }

  try {
    const hlsTranscode = app.get(HlsTranscodeService);
    hlsTranscode.logActiveProvider();
  } catch {
    // HlsTranscodeService not available in some setups
  }

  console.log(colors.gray('────────────────────────────────────────'));
}
bootstrap();
