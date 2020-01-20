import {
    Controller, Get, Response,
    HttpStatus,
    Query,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
    Headers,
    UnauthorizedException, } from '@nestjs/common';

@Controller('resource-planing')
export class ResourcePlaningController {
    constructor(
    ) { }
    @Get('current')
    async currentUserResources(@Headers() headers: any, @Response() res: any, @Query() params) {
        // const userId = await this.authService.getVerifiedUserId(headers.authorization);
        // if (!userId) {
        //     throw new UnauthorizedException();
        // }
        return res.status(HttpStatus.OK).json({"currentUserResources": "ok"});
    }
}
