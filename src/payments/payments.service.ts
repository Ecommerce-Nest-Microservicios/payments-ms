import { Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import Stripe from 'stripe';
import config from 'src/config/config';
import { ConfigType } from '@nestjs/config';
import { catchError, from, map, Observable } from 'rxjs';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { NATS_SERVICE } from 'src/config/microservices';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(config.KEY)
    private readonly configService: ConfigType<typeof config>,
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
  ) {}
  private readonly stripe = new Stripe(this.configService.STRIPE_SECRET_KEY);

  createSession(
    createPaymentDto: CreatePaymentDto,
  ): Observable<Stripe.Checkout.Session> {
    const { items, currency, orderId } = createPaymentDto;
    console.log(items);
    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));
    console.log(line_items);
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

        const payload = {
          stripePaymentId: chargeSucceeded.id,
          orderId: chargeSucceeded.metadata.orderId,
          receiptUrl: chargeSucceeded.receipt_url,
        };
        this.client.emit('payment.succeeded', payload);
        break;

      default:
        break;
    }

    res.status(200).json({ sig });
  }
}
