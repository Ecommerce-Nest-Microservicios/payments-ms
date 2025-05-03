import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Main - Payments Microservice');

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.NATS,
      options: {
        servers: [...process.env.NATS_SERVERS.split(',')],
      },
    },
    {
      inheritAppConfig: true,
    },
  );

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3003);

  logger.log(`Payments Microservice running...`);
}
bootstrap();
