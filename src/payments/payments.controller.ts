import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Request, Response } from 'express';

@Controller('api/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-session')
  createPaymentSession(@Body() createPaymentDto: CreatePaymentDto) {
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
    return this.paymentsService.webhook(req, res);
  }
}
