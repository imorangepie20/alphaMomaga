import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { getApiPort } from './config/api-port.js';
import { loadEnvironmentFile } from './config/load-environment.js';

async function bootstrap() {
  // AuthConfigService reads process.env during Nest application construction.
  loadEnvironmentFile();
  const app = await NestFactory.create(AppModule);
  await app.listen(getApiPort(process.env.PORT));
}
await bootstrap();
