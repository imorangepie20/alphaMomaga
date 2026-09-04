import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getBillingMonth } from './billing.js';
import { BillingService } from './billing.service.js';

@Injectable()
export class BillingScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(BillingScheduler.name);

  constructor(private readonly billingService: BillingService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.catchUp();
    } catch (error) {
      this.logger.error('Failed to catch up monthly billing charges during startup', error);
    }
  }

  async catchUp(referenceDate = new Date()): Promise<void> {
    await this.billingService.generateMonth(getBillingMonth(referenceDate), referenceDate);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, { timeZone: 'Asia/Seoul' })
  async runDaily(): Promise<void> {
    await this.catchUp();
  }
}
