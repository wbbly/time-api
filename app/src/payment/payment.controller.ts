import {Body, Controller, HttpStatus, Post, Response} from '@nestjs/common';

@Controller('payment')
export class PaymentController {
    @Post('/')
    async webhookHandler(@Response() res: any, @Body() body: any) {
        console.log(`body`, body);
        return res.status(HttpStatus.OK).json({massage: 'OK'});
    }
}
