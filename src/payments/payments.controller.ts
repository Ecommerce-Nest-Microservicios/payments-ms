import { Controller, Get, Post, Req, Res, Logger } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Request, Response } from 'express';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('api/payments')
export class PaymentsController {
  private readonly logger = new Logger('Payments Microservice');
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern('createSession')
  createPaymentSession(@Payload() createPaymentDto: CreatePaymentDto) {
    this.logger.log(`Creating payment session...`);

    return this.paymentsService.createSession(createPaymentDto);
  }

  @Get('success')
  findAll() {
    return this.paymentsService.success();
  }

  @Get('cancel')
  findOne() {
    return this.paymentsService.cancel();
  }

  @Post('webhook')
  stripeWebhook(@Req() req: Request, @Res() res: Response) {
    this.logger.log(`Webhook recived`);

    return this.paymentsService.webhook(req, res);
  }
}
