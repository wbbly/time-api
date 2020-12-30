import {
    Controller,
    Get,
    HttpStatus,
    Param,
    UnauthorizedException,
    UseGuards,
    Headers,
    Response,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError } from 'axios';
import { SubscriptionService } from './subscription.service';

@Controller('subscription')
export class SubscriptionController {
    constructor(private readonly authService: AuthService, private readonly subscriptionService: SubscriptionService) {}

    @Get('list')
    @UseGuards(AuthGuard())
    async getSubscriptions(@Headers() headers: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        let subscriptions = null;
        try {
            subscriptions = await this.subscriptionService.getSubscriptions();
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }

        if (!subscriptions) {
            return res.status(HttpStatus.FORBIDDEN).json({ message: 'ERROR.SUBSCRIPTIONS.GET_SUBSCRIPTIONS_FAILED' });
        }

        return res.status(HttpStatus.OK).json(subscriptions);
    }

    @Get(':id')
    @UseGuards(AuthGuard())
    async getSubscriptionById(@Headers() headers: any, @Param() param: any, @Response() res: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        try {
            const subscription = await this.subscriptionService.getSubscriptionByPlanId(param.id);
            return res.status(HttpStatus.OK).json(subscription);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
