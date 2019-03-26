import { Module, HttpModule } from '@nestjs/common';

import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
    imports: [HttpModule],
    controllers: [RoleController],
    providers: [RoleService],
})
export class RoleModule {}
