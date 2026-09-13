import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(data: Partial<Notification>): Promise<NotificationDocument> {
    const created = new this.notificationModel(data);
    return created.save();
  }

  async findRecent(limit = 20): Promise<NotificationDocument[]> {
    return this.notificationModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async countUnread(): Promise<number> {
    return this.notificationModel.countDocuments({ isRead: false }).exec();
  }

  async markAsRead(id: string): Promise<NotificationDocument | null> {
    return this.notificationModel
      .findByIdAndUpdate(id, { $set: { isRead: true } }, { new: true })
      .exec();
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationModel.updateMany({ isRead: false }, { $set: { isRead: true } }).exec();
  }
}
