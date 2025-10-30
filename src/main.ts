import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(WorkerModule);
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
