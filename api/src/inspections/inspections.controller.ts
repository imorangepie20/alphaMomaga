import { Controller, Get } from '@nestjs/common';
import { InspectionsService } from './inspections.service.js';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get()
  findAll() {
    return this.inspectionsService.findAll();
  }
}