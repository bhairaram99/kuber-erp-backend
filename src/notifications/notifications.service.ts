import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { NotificationCategory, NotificationType } from '../common/enums/notification.enum';

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  async create(data: {
    title: string;
    message: string;
    type?: NotificationType;
    category?: NotificationCategory;
    referenceId?: string;
  }) {
    return this.notificationsRepository.create({
      title: data.title,
      message: data.message,
      type: data.type || NotificationType.INFO,
      category: data.category || NotificationCategory.SYSTEM,
      referenceId: data.referenceId || '',
      isRead: false,
    });
  }

  async getRecent(limit = 20) {
    const [notifications, unreadCount] = await Promise.all([
      this.notificationsRepository.findRecent(limit),
      this.notificationsRepository.countUnread(),
    ]);

    return {
      notifications,
      unreadCount,
    };
  }

  async markAsRead(id: string) {
    return this.notificationsRepository.markAsRead(id);
  }

  async markAllAsRead() {
    await this.notificationsRepository.markAllAsRead();
    return { message: 'All notifications marked as read' };
  }
}
