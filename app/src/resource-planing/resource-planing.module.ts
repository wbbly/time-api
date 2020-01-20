import { Module } from '@nestjs/common';

import { CoreModule } from '../core/core.module';
import { ResourcePlaningController } from "./resource-planing.controller";
import { ResourcePlaningService } from "./resource-planing.service";

@Module({
    imports: [CoreModule],
    controllers: [ResourcePlaningController],
    providers: [ResourcePlaningService],
    exports: [ResourcePlaningService],
})
export class ResourcePlaningModule {}
