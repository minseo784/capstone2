import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IslandsModule } from './islands/islands.module';
import { ProblemModule } from './problem/problem.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    PrismaModule,
    IslandsModule,
    ProblemModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
