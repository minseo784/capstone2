// src/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaModule } from '../prisma/prisma.module'; // PrismaModule이 있다고 가정

@Module({
  imports: [PrismaModule], // DB 접근을 위해 PrismaModule 필요
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService], // 나중에 다른 모듈(AI 튜터 등)에서 쓸 수도 있으니 export
})
export class EventsModule {}