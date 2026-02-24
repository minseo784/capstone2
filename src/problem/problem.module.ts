import { Module } from '@nestjs/common';
import { ProblemController } from './problem.controller';
import { ProblemService } from './problem.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProblemAdminController } from './problem.admin.controller';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [EventsModule],
  controllers: [ProblemController, ProblemAdminController],
  providers: [ProblemService, PrismaService],
})
export class ProblemModule {}