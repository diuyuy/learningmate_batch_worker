import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BATCH_OPTIONS } from 'src/constants/batch-options';
import { BatchService } from './batch.service';
import { BatchQueueData } from './types/types';

@Processor(BATCH_OPTIONS.QUEUE_NAME)
export class BatchConsumer extends WorkerHost {
  constructor(private readonly batchService: BatchService) {
    super();
  }

  async process(job: Job<BatchQueueData>) {
    switch (job.name) {
      case BATCH_OPTIONS.JOB_NAME:
        await this.batchService.generateContents(BigInt(job.data.keywordId));
        break;
    }
  }
}
