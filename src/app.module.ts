import { Module, NestModule, MiddlewareConsumer, BadRequestException } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core'; 
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { IslandsModule } from './islands/islands.module';
import { ProblemModule } from './problem/problem.module';
import { AdminController } from './admin/admin.controller';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    AuthModule, PrismaModule, IslandsModule, ProblemModule
  ],
  controllers: [AppController, AdminController],
  providers: [
    AppService,
    // 보안 가드 로직
    {
      provide: APP_INTERCEPTOR,
      useValue: {
        intercept: (context, next) => {
          const req = context.switchToHttp().getRequest();
          const body = JSON.stringify(req.body || {}).toLowerCase();
  
          if (['<script', 'select ', 'drop ', 'union '].some(word => body.includes(word))) {
            throw new BadRequestException('보안 위협 감지'); 
          }
          return next.handle();
        },
      },
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}