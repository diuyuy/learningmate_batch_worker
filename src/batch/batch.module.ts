import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BATCH_OPTIONS } from 'src/constants/batch-options';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { EnvSchema } from '../config/validate-env';
import { BatchConsumer } from './batch.consumer';
import { BatchService } from './batch.service';
import { BraveSearchService } from './brave-search.service';
import { CrawlingService } from './crawling.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService<EnvSchema, true>) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: BATCH_OPTIONS.QUEUE_NAME,
    }),
  ],
  providers: [BraveSearchService, CrawlingService, BatchService, BatchConsumer],
})
export class BatchModule {}
