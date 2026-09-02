import type { Request } from 'express';

export type AuthenticatedPrincipal = {
  role: string;
  subject: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedPrincipal;
};