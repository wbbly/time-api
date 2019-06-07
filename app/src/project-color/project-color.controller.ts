import { Controller, Get, Response, HttpStatus, UseGuards, Headers } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AxiosError } from 'axios';

import { ProjectColorService } from './project-color.service';

@Controller('project-color')
export class ProjectColorController {
    constructor(private readonly projectColorService: ProjectColorService) {}

    @Get('list')
    @UseGuards(AuthGuard())
    async projectColorList(@Headers() headers: any, @Response() res: any) {
        try {
            const projectColorListRes = await this.projectColorService.getProjectColorList();
            return res.status(HttpStatus.OK).json(projectColorListRes);
        } catch (e) {
            const error: AxiosError = e;
            return res.status(HttpStatus.BAD_REQUEST).json(error.response ? error.response.data.errors : error);
        }
    }
}
