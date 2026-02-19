// backend/src/main.ts

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import Redis from 'ioredis';



async function bootstrap() {

  const app = await NestFactory.create(AppModule);

  app.enableCors({

    origin: 'http://localhost:3000',

    credentials: true,

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization'],

  });
  // 🚨 [임시 추가] Redis 초기화 코드 (한 번 접속 성공하면 나중에 지우세요)
  const redis = new Redis({ host: 'localhost', port: 6379 });
  await redis.flushall();
  console.log('🧹 Redis 차단 기록이 초기화되었습니다!');



  await app.listen(Number(process.env.PORT) || 4000);

  console.log('🚀 Backend running on http://localhost:4000');

}

bootstrap();