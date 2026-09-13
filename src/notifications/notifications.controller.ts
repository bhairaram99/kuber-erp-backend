import { Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiOperation({ summary: 'Get recent user & system notifications' })
  async getRecent(@Query('limit') limit?: number) {
    return this.notificationsService.getRecent(limit ? Number(limit) : 20);
  }

  @Patch(':id/read')
  @RequirePermission(PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiOperation({ summary: 'Mark a single notification as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('mark-all-read')
  @RequirePermission(PERMISSIONS.NOTIFICATIONS_VIEW)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }
}
