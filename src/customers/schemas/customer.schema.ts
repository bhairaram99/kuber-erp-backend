import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ProductStatus } from '../../common/enums/product-status.enum';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true, collection: 'customers' })
export class Customer {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  customerCode: string;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ default: '', trim: true, index: true })
  phone: string;

  @Prop({ default: '', lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ default: '', trim: true })
  company: string;

  @Prop({ default: '', trim: true })
  address: string;

  @Prop({ default: '', trim: true })
  city: string;

  @Prop({ default: '', trim: true })
  state: string;

  @Prop({ default: 'India', trim: true })
  country: string;

  @Prop({ default: '', trim: true })
  postalCode: string;

  @Prop({ default: 'Wholesale Buyer', trim: true })
  customerType: string; // Retail, Wholesale, Contractor, Furniture Maker

  @Prop({ default: '', trim: true })
  taxNumber: string; // GSTIN

  @Prop({ default: 100000, min: 0 })
  creditLimit: number;

  @Prop({ default: 0 })
  totalPurchases: number;

  @Prop({ default: 0 })
  totalPaid: number;

  @Prop({ default: 0 })
  totalDue: number;

  @Prop({ default: '', trim: true })
  notes: string;

  @Prop({
    type: String,
    enum: Object.values(ProductStatus),
    default: ProductStatus.ACTIVE,
    index: true,
  })
  status: ProductStatus;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ name: 'text', company: 'text', customerCode: 'text', phone: 'text' });
