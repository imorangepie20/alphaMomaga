import { Controller, Get } from '@nestjs/common';
import { ContractsService } from './contracts.service.js';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  findAll() {
    return this.contractsService.findAll();
  }
}