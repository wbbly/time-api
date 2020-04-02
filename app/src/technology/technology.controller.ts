import {
    Controller,
    Response,
    HttpStatus,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Headers,
    UnauthorizedException,
    Delete,
    Get,
    Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { AuthService } from '../auth/auth.service';
import { TechnologyService } from './technology.service';

@Controller('technology')
export class TechnologyController {
    constructor(private readonly authService: AuthService, private readonly technologyService: TechnologyService) {}

    @Post('add')
    @UseGuards(AuthGuard())
    async createTimerPlanning(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        if (!body.title) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res.status(HttpStatus.OK).json(await this.technologyService.createTechnology(body.title.trim()));
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TECHNOLOGY.CREATE_TECHNOLOGY_FAILED' });
        }
    }

    @Get('list')
    @UseGuards(AuthGuard())
    async getTechnology(@Headers() headers: any, @Response() res: any, @Query() query: { title: string }) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }
        const { title } = query;

        if (!title) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res.status(HttpStatus.OK).json(await this.technologyService.getTechnology(title.trim()));
        } catch (error) {
            console.log(error);
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TECHNOLOGY.GET_TECHNOLOGY_FAILED' });
        }
    }
}
