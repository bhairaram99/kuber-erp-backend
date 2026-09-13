import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingDocument = Setting & Document;

@Schema({ timestamps: true, collection: 'settings' })
export class Setting {
  @Prop({ default: 'Bhairav Timber & Plywood Mart', trim: true })
  businessName: string;

  @Prop({ default: '' })
  logo: string;

  @Prop({ default: 'Plot 108, National Highway 8, Timber Zone, GIDC', trim: true })
  address: string;

  @Prop({ default: '+91 98250 12345', trim: true })
  phone: string;

  @Prop({ default: 'contact@wooderp.com', trim: true })
  email: string;

  @Prop({ default: '24AAAAA0000A1Z5', trim: true })
  taxNumber: string;

  @Prop({ default: 'INR', trim: true })
  currency: string;

  @Prop({ default: '₹', trim: true })
  currencySymbol: string;

  @Prop({ default: 'Asia/Kolkata', trim: true })
  timezone: string;

  @Prop({ default: 'INV', trim: true })
  invoicePrefix: string;

  @Prop({ default: 'PO', trim: true })
  purchasePrefix: string;

  // Inventory settings
  @Prop({ default: 10, min: 0 })
  lowStockThreshold: number;

  @Prop({ default: false })
  allowNegativeStock: boolean;

  @Prop({ default: true })
  requireStockAdjustmentReason: boolean;

  // Sales settings
  @Prop({ default: 20, min: 0, max: 100 })
  maxDiscountPercentage: number;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
