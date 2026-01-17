// backend/src/main.ts

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';



async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.enableCors({

    origin: 'http://localhost:3000',

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

  });



  await app.listen(Number(process.env.PORT) || 4000);

  console.log('🚀 Backend running on http://localhost:4000');

}

bootstrap();