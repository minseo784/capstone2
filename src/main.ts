import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(Number(process.env.PORT) || 4000);

  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });
}
bootstrap();

