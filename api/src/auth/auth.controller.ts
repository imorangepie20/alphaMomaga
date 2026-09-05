import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard.js';
import type { AuthenticatedRequest } from './principal.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('status')
  async status(@Req() request: AuthenticatedRequest) {
    const principal = await this.authService.verifyBearerToken(request.header('authorization'), true);
    return { status: principal.role === 'Pending' ? 'pending' : 'approved' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest) {
    return { role: request.user?.role, subject: request.user?.subject };
  }
}
