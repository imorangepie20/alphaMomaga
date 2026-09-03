import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { getApiPort } from './config/api-port.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(getApiPort(process.env.PORT));
}
await bootstrap();
