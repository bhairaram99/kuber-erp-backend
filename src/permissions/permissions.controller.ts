import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ROLES_VIEW)
  @ApiOperation({ summary: 'Get all available system permissions' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  @RequirePermission(PERMISSIONS.ROLES_CREATE)
  @ApiOperation({ summary: 'Create a new permission' })
  async create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }
}
