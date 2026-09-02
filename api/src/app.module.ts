import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PropertiesController } from './properties/properties.controller.js';
import { PropertiesService } from './properties/properties.service.js';

@Module({
  imports: [],
  controllers: [AppController, PropertiesController],
  providers: [AppService, PropertiesService],
})
export class AppModule {}
