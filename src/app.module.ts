import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { environments } from './config/environments';
import config from './config/config';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: environments[process.env.NODE_ENV],
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        NATS_SERVERS: Joi.string()
          .custom((value, helpers) => {
            const servers = value.split(',');
            if (servers.every((server: any) => typeof server === 'string')) {
              return servers;
            } else {
              return helpers.message({
                'any.invalid': 'NATS_SERVERS must be a valid list of strings',
              });
            }
          })
          .required(),
        DATABASE_URL: Joi.string().required(),
        STRIPE_SECRET_KEY: Joi.string().required(),
        STRIPE_SUCCESS_URL: Joi.string().required(),
        STRIPE_CANCEL_URL: Joi.string().required(),
        STRIPE_WEBHOOK_SECRET: Joi.string().required(),
      }),
    }),

    PaymentsModule,
  ],
})
export class AppModule {}
