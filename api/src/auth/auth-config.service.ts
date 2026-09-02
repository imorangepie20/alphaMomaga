import { Injectable, Logger } from '@nestjs/common';

export type AuthProvider = 'auth0' | 'keycloak' | 'google' | 'custom';

export interface AuthConfig {
  provider: AuthProvider;
  jwksUrl: string;
  issuer: string;
  audience: string;
  allowDemoRole: boolean;
  environment: 'production' | 'staging' | 'development';
}

@Injectable()
export class AuthConfigService {
  private readonly logger = new Logger(AuthConfigService.name);
  private config: AuthConfig | null = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const environment = (process.env.NODE_ENV ?? 'development') as 'production' | 'staging' | 'development';
    const provider = this.detectProvider();

    const jwksUrl = process.env.AUTH_JWKS_URL;
    const issuer = process.env.AUTH_ISSUER;
    const audience = process.env.AUTH_AUDIENCE ?? 'default';
    const allowDemoRole = process.env.AUTH_ALLOW_DEMO_ROLE === 'true';

    if (!jwksUrl || !issuer) {
      if (environment === 'production') {
        this.logger.warn('Production environment but AUTH_JWKS_URL or AUTH_ISSUER not set');
      }
      return;
    }

    this.config = {
      provider,
      jwksUrl,
      issuer,
      audience,
      allowDemoRole: environment === 'production' ? false : allowDemoRole,
      environment,
    };

    this.logger.log(`Auth configured with provider: ${provider}, environment: ${environment}`);
  }

  private detectProvider(): AuthProvider {
    const jwksUrl = process.env.AUTH_JWKS_URL ?? '';
    const issuer = process.env.AUTH_ISSUER ?? '';

    if (jwksUrl.includes('auth0.com') || issuer.includes('auth0.com')) {
      return 'auth0';
    }
    if (jwksUrl.includes('keycloak') || issuer.includes('keycloak')) {
      return 'keycloak';
    }
    if (jwksUrl.includes('google') || issuer.includes('google')) {
      return 'google';
    }
    return 'custom';
  }

  getConfig(): AuthConfig | null {
    return this.config;
  }

  isConfigured(): boolean {
    return this.config !== null;
  }

  getProvider(): AuthProvider | null {
    return this.config?.provider ?? null;
  }

  getEnvironment(): 'production' | 'staging' | 'development' {
    return this.config?.environment ?? 'development';
  }

  isDemoModeEnabled(): boolean {
    return this.config?.allowDemoRole ?? false;
  }

  getJwksUrl(): string | null {
    return this.config?.jwksUrl ?? null;
  }

  getIssuer(): string | null {
    return this.config?.issuer ?? null;
  }

  getAudience(): string {
    return this.config?.audience ?? 'default';
  }
}
