import {
    Controller,
    Get,
    HttpStatus,
    Post,
    UnauthorizedException,
    UseGuards,
    Response,
    Headers,
    Body,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError } from 'axios';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService, private readonly authService: AuthService) {}

    @Get('list')
    @UseGuards(AuthGuard())
    async clientList(@Headers() headers: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const clientList = await this.paymentService.getPaymentByUserId(userId);
            return res.status(HttpStatus.OK).json(clientList);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }

    @Post('/')
    async webhookHandler(@Response() res: any, @Body() body: any) {
        const { Event, ...params } = body;

        const that = this; // get webhookHandler this in that

        const eventHandler = {
            async eventContractCreated() {
                // Sent when a contract was created either via self-service or Admin UI.
                // Use for create a new account in your system and send a welcome email.
                console.log('eventContractCreated');
                await that.paymentService.createPayment(params.ContractId);
            },

            async eventContractChanged() {
                // ContractChanged. Sent whenever the state of a contract has changed. The trial, contract has ended.
                // Up- or downgraded. A component subscription was added or removed
                console.log('eventContractChanged');
                await that.paymentService.contractChanged(params.ContractId);
            },

            async eventOrderSucceeded() {
                // You want to listen to this hook to send an order confirmation by email to the customer.
            },

            async eventContractCancelled() {
                // was triggered, NOT when the contract actually ends
                // Usually a cancellation is triggered some time before the contract actually ends (notice period)
            },

            async eventCustomerCreated() {
                // Create a new customer on our side.
            },

            async eventCustomerChanged() {
                // For sync between your system and billwerk.
            },

            async eventCustomerDeleted() {
                // Sent whenever the base information of a customer has deleted. for inform about that customer deleted
            },

            async eventCustomerLocked() {
                // Usually, you want to inform about that customer locked
            },
            async eventCustomerUnlocked() {
                // Usually, you want to inform about that customer unlocked
            },

            async eventDunningCreated() {
                // Triggered when a new dunning PDF was created and sent/archived
            },

            async eventInvoiceCreated() {
                // Triggered when a new invoice or credit note PDF was created and sent/archived.
            },

            async eventTrialEndApproaching() {
                // You want to send a reminder to your customer if the trial expires in x days.
            },

            async eventPaymentBearerExpiring() {
                // You probably want to inform your customer and ask them to provide new payment information
            },

            async eventPaymentBearerExpired() {
                // Notifies you about a payment bearer that just expired
            },

            async eventDebitAuthCancelled() {
                // Triggered when the authorization to debit money has been revoked either by customer or PSP
            },
            async eventPaymentDataChanged() {
                // Triggered when the authorization to debit money has been revoked either by customer or PSP
            },

            async eventPaymentEscalated() {
                // Triggered based on your payment escalation settings.
            },

            async eventPaymentEscalationReset() {
                // Triggered when an escalation process was reset automatically or manually.
            },

            async eventPaymentRegistered() {
                // Will be triggered when a new external payment/refund is registered in billwerk
            },

            async eventSwitch(event) {
                try {
                    const callAction = `event${event}`;

                    if (this[callAction]) {
                        await this[callAction]();
                    } else {
                        // handling other events (in switch default)
                    }

                    return res.status(HttpStatus.OK).json({ massage: 'OK' });
                } catch (e) {
                    console.log(`Error in payment controller with ${event} event:`, e);
                }
            },
        };

        eventHandler.eventSwitch(Event);
    }
}
