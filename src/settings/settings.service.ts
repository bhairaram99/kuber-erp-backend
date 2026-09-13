import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getSettings() {
    return this.settingsRepository.getSettings();
  }

  async updateSettings(dto: UpdateSettingDto) {
    return this.settingsRepository.updateSettings(dto);
  }
}
