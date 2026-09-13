import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AuditLogDocument = AuditLog & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: 'audit_logs' })
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, index: true })
  userId: User | string;

  @Prop({ required: true, trim: true, index: true })
  action: string; // 'CREATE', 'UPDATE', 'DELETE', 'STOCK_ADJUSTMENT', 'STOCK_RESET', 'SALE_CONFIRM', 'SALE_CANCEL', 'LOGIN'

  @Prop({ required: true, trim: true, index: true })
  module: string; // 'products', 'inventory', 'sales', 'purchases', 'users', 'roles', 'settings'

  @Prop({ default: '', trim: true, index: true })
  entityType: string;

  @Prop({ default: '', trim: true, index: true })
  entityId: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  previousData: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  newData: any;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  metadata: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ module: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
