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
    async createTechnology(@Headers() headers: any, @Response() res: any, @Body() body: any) {
        const userId = await this.authService.getVerifiedUserId(headers.authorization);
        if (!userId) {
            throw new UnauthorizedException();
        }

        const { title } = body;
        const technologyTitle = title.trim();

        if (!technologyTitle) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res.status(HttpStatus.OK).json(await this.technologyService.createTechnology(technologyTitle));
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
        const technologyTitle = title.trim();

        if (!technologyTitle) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.CHECK_REQUEST_PARAMS' });
        }

        try {
            return res.status(HttpStatus.OK).json(await this.technologyService.getTechnologiesByTitle(technologyTitle));
        } catch (error) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'ERROR.TECHNOLOGY.GET_TECHNOLOGY_FAILED' });
        }
    }
}
