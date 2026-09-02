import { Module } from '@nestjs/common';
import { DatabaseController } from './database.controller.js';
import { DatabaseService } from './database.service.js';

@Module({
  controllers: [DatabaseController],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}