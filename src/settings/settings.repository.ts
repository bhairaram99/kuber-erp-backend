import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/setting.schema';

@Injectable()
export class SettingsRepository {
  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  async getSettings(): Promise<SettingDocument> {
    let settings = await this.settingModel.findOne().exec();
    if (!settings) {
      settings = await new this.settingModel({}).save();
    }
    return settings;
  }

  async updateSettings(data: Partial<Setting>): Promise<SettingDocument> {
    const existing = await this.getSettings();
    return this.settingModel
      .findByIdAndUpdate(existing._id, { $set: data }, { new: true })
      .exec();
  }
}
