import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  NotificationCategory,
  NotificationType,
} from '../../common/enums/notification.enum';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(NotificationType),
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Prop({
    type: String,
    enum: Object.values(NotificationCategory),
    default: NotificationCategory.SYSTEM,
  })
  category: NotificationCategory;

  @Prop({ default: '', trim: true })
  referenceId: string;

  @Prop({ default: false, index: true })
  isRead: boolean;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ isRead: 1, createdAt: -1 });
