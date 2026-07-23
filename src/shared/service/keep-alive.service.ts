import { Injectable, Logger, Module } from '@nestjs/common';
import { Cron, CronExpression, ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
})
@Injectable()
export class KeepAliveService {
  private readonly logger = new Logger(KeepAliveService.name);

  @Cron(CronExpression.EVERY_10_MINUTES)
  async keepAlive() {
    await fetch(process.env.APP_URL + '/health');
    this.logger.debug('Health check performed');
  }
}
