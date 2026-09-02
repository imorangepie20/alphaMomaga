import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service.js';

@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }
}