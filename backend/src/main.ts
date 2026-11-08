import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:5173'),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Stroyka API')
    .setDescription('API for construction materials store')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);
  console.log(`✅ Application is running on: http://localhost:${port}`);
  console.log(`✅ Health check: http://localhost:${port}/health`);
  console.log(`✅ Swagger docs: http://localhost:${port}/api-docs`);
  console.log(`✅ Environment: ${configService.get('NODE_ENV')}`);
  console.log(`✅ Database type: ${configService.get('DB_TYPE', 'postgres')}`);
}
bootstrap();