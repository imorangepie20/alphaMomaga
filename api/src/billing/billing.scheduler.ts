import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { getBillingMonth } from './billing.js';
import { BillingService } from './billing.service.js';

@Injectable()
export class BillingScheduler {
  constructor(private readonly billingService: BillingService) {}

  async catchUp(referenceDate = new Date()): Promise<void> {
    await this.billingService.generateMonth(getBillingMonth(referenceDate), referenceDate);
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM, { timeZone: 'Asia/Seoul' })
  async runDaily(): Promise<void> {
    await this.catchUp();
  }
}
