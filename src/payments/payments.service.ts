import { Inject, Injectable, Req } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import Stripe from 'stripe';
import config from 'src/config/config';
import { ConfigType } from '@nestjs/config';
import { catchError, from, map, Observable } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
  ) {}
  private readonly stripe = new Stripe(this.configService.STRIPE_SECRET_KEY);

  createSession(
    createPaymentDto: CreatePaymentDto,
  ): Observable<Stripe.Checkout.Session> {
    const { items, currency, orderId } = createPaymentDto;

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    return from(
      this.stripe.checkout.sessions.create({
        payment_intent_data: {
          metadata: {
            orderId,
          },
        },
        line_items,
        mode: 'payment',
        success_url: this.configService.STRIPE_SUCCESS_URL,
        cancel_url: this.configService.STRIPE_CANCEL_URL,
      }),
    ).pipe(
      map((session) => session),
      catchError((error) => {
        throw error instanceof RpcException
          ? error
          : new RpcException({
              message: error.message || 'Unexpected error occurred',
              error: error.code || 'Internal Server Error',
              code: 500,
            });
      }),
    );
  }

  success() {
    return `This action returns a success payment`;
  }

  cancel() {
    return `This action returns a cancel payment`;
  }

  webhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        this.configService.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      res.status(400).send(`Webhook Eroor: ${error.message}`);
      return;
    }

    switch (event.type) {
      case 'charge.succeeded':
        const chargeSucceeded = event.data.object;
        console.log({ metadata: chargeSucceeded.metadata });
        break;

      default:
        break;
    }

    res.status(200).json({ sig });
  }
}
