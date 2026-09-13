import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PERMISSIONS } from '../common/constants/permissions.constant';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get business configurations and rules' })
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @RequirePermission(PERMISSIONS.SETTINGS_UPDATE)
  @ApiOperation({ summary: 'Update business settings and operational rules' })
  async updateSettings(@Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSettings(dto);
  }
}
