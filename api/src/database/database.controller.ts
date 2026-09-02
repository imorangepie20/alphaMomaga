import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service.js';

@Controller('health')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('database')
  health() {
    return this.databaseService.health();
  }
}